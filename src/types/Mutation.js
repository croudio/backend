import Incentive from './Incentive'
import Action from './Action'
import User from './User'
import Profile from './Profile'
import Lead from './Lead'
import Payment from './Payment'
import CreateLeadInput from './CreateLeadInput'
import CreateUserInput from './CreateUserInput'
import CreateActionInput from './CreateActionInput'
import CreateIncentiveInput from './CreateIncentiveInput'
import CreateProfileInput from './CreateProfileInput'
import CreatePaymentInput from './CreatePaymentInput'
import UpdateUserInput from './UpdateUserInput'
import UpdateProfileInput from './UpdateProfileInput'
import UpdateActionInput from './UpdateActionInput'
import UpdateIncentiveInput from './UpdateIncentiveInput'
import AssignActionInput from './AssignActionInput'
import Token from './Token'

const Mutation = `
type Mutation {

  requestToken(
    email: String!
    password: String!,
  ): Token

  redirect(
    hash: String!
    session: String!
  ): Lead

  createUser(
    input: CreateUserInput
  ): User

  createAction(
    input: CreateActionInput
  ): Action

  createIncentive(
    input: CreateIncentiveInput
  ): Incentive

  createLead(
    input: CreateLeadInput
  ): Lead

  createProfile(
    input: CreateProfileInput
  ): Profile

  createPayment(
    input: CreatePaymentInput
  ): Payment

  updateUser(
    input: UpdateUserInput
  ): User

  updateProfile(
    input: UpdateProfileInput
  ): Profile

  updateIncentive(
    input: UpdateIncentiveInput
  ): Incentive

  assignAction(
    input: AssignActionInput
  ): Action
}
`

export default [
  Mutation,
  ...User, CreateUserInput, UpdateUserInput,
  ...Action, CreateActionInput, UpdateActionInput,
  ...Incentive, CreateIncentiveInput, UpdateIncentiveInput,
  ...Lead, CreateLeadInput,
  ...Payment, CreatePaymentInput,
  ...Profile, CreateProfileInput, UpdateProfileInput,
  AssignActionInput,
  Token,
]
