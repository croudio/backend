import { session, transformOne, transformMany, uuid, handleError, cookieExists, getUserFromCookie, randomColor } from './helpers'
import { getUserByLead, createUserFromSession } from './User'
import { getProfileByLead } from './Profile'
import { getEventsForLead, getEventsForLeadAndType, viewedProfile, invitedFriend } from './Event'
import { unique } from 'shorthash'
import moment from 'moment'

export const createLead = ({ id, user, parent, hash, source, motivation, status, score, color }) => session
  .run(`
    MATCH (b:Lead { id: $parent })
    MATCH (c:User { id: $user })
    CREATE (a:Lead $lead)
    CREATE (b)-[:HAS_LEAD]->(a)
    CREATE (c)-[:HAS_LEAD]->(a)
    RETURN a
  `,
    {
      user,
      parent,
      lead: {
        id: id || uuid(),
        createdAt: moment().format(),
        hash: hash || unique(uuid()),
        source: source || 'unknown',
        motivation,
        status,
        score,
        color: color || randomColor(),
      },
    }
  )
  .then(result => transformOne(result, session))
  .then(lead => {

    switch(source) {

      case 'invitation':
        invitedFriend(parent, lead.id)
        break;

      default: viewedProfile(lead.id)

    }

    return lead
  })
  .catch(handleError)



export const getLeads = () => session
  .run(`
    MATCH (a:Lead)<-[r:HAS_LEAD]-(:Lead)
    RETURN a
  `)
  .then(result => transformMany(result, session))
  .catch(handleError)

export const findLeadsForProfile = id => session
  .run(`
    MATCH (a:Lead)<-[r:HAS_LEAD*]-(:Profile { id: $id })<-[:HAS_PROFILE]-(owner:User)
    MATCH (a)<-[:HAS_LEAD]-(user:User)
    WHERE NOT user.id = owner.id
    WITH a, max(size(r)) AS depth
    RETURN a, depth
  `, { id })
  .then(result => transformMany(result, session))
  .catch(handleError)

export const findLeadsForUser = id => session
  .run(`
    MATCH (a:Lead)<-[r:HAS_LEAD]-(:User { id: $id })
    RETURN a
  `, { id })
  .then(result => transformMany(result, session))
  .catch(handleError)

export const findParents = (id, user) => session
  .run(`
    MATCH (:Lead { id: $id })<-[r:HAS_LEAD*]-(a:Lead)<-[:HAS_LEAD]-(u:User)
    WHERE NOT u.id = $user
    WITH a, max(size(r)) AS depth
    RETURN a, depth
  `, { id, user })
  .then(result => transformMany(result, session))
  .catch(handleError)

export const getLead = id => session
  .run(`
    MATCH (a:Lead { id: $id })
    RETURN a
  `, { id })
  .then(result => transformOne(result, session))
  .catch(handleError)

export const getLeadByHash = hash => session
  .run(`
    MATCH (a:Lead { hash: $hash })
    RETURN a
  `, { hash })
  .then(result => transformOne(result, session))
  .catch(handleError)

export const getLeadByEvent = id => session
  .run(`
    MATCH (a:Lead)--(:Event { id: $id })
    RETURN a LIMIT 1
  `, { id })
  .then(result => transformOne(result, session))

export const getLeadByReward = id => session
  .run(`
    MATCH (a:Lead)-[:RECEIVED_REWARD]->(:Reward { id: $id })
    RETURN a LIMIT 1
  `, { id })
  .then(result => transformOne(result, session))

export const getLeadThatCausedReward = id => session
  .run(`
    MATCH (a:Lead)-[:CAUSED_REWARD]->(:Reward { id: $id })
    RETURN a LIMIT 1
  `, { id })
  .then(result => transformOne(result, session))

export const getParent = id => session
  .run(`
    MATCH (:Lead { id: $id })<-[:HAS_LEAD]-(a:Lead)
    RETURN a
  `, { id })
  .then(result => transformOne(result, session))
  .catch(handleError)

export const getChildrenBySource = (id, source) => session
  .run(`
    MATCH (a:Lead { source: $source })<-[:HAS_LEAD]-(:Lead { id: $id })
    RETURN a
  `, { id, source })
  .then(result => transformMany(result, session))
  .catch(handleError)

export const findLeadForUserAndHash = (userId, hash) => session
  .run(`
    MATCH (u:User { id: $userId })-[:HAS_LEAD]->(a:Lead)
    WHERE (a)<-[:HAS_LEAD*]-(:Lead { hash: $hash })
    OR (a.hash = $hash )
    RETURN a
  `, { userId, hash })
  .then(result => transformOne(result, session))
  .catch(handleError)

export const findLeadByProfile = profile => session
  .run(`
    MATCH (a:Lead)<-[r:HAS_LEAD]-(:Profile { id: $profile })
    RETURN a
  `, { profile })
  .then(result => transformOne(result, session))
  .catch(handleError)

export const redirect = async (hash, session, user) => {

  // If we don't have a user, we want to create a new user,
  // based on the current session ...
  const existingOrCreatedUser = user ? user : await createUserFromSession(session)

  // Do we have an existing lead?
  const lead = await findLeadForUserAndHash(existingOrCreatedUser.id, hash)

  // Yes, just return it or create one for this user...
  // We have to find the lead by the hash first, and then
  // we can create a new lead based on the parent id.
  return lead || getLeadByHash(hash)
    .then(lead => createLead({
      parent: lead.id,
      user: existingOrCreatedUser.id,
      hash: lead.hash,
      status: 'some-status',
    }))
}

export default {
  profile: (lead) => getProfileByLead(lead.id),
  user: (lead) => getUserByLead(lead.id),
  parent: (lead) => getParent(lead.id),
  parents: (lead, _, { user }) => findParents(lead.id, user.id),
  invited: (lead) => getChildrenBySource(lead.id, 'invitation'),
  events: (lead, { ofType }) => ofType ? getEventsForLeadAndType(lead.id, ofType) : getEventsForLead(lead.id),
}
