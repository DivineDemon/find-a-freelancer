import { api } from "./core";
export const addTagTypes = [
  "Authentication",
  "User Management",
  "Chat Management",
  "Message Management",
  "payments",
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      healthCheckGet: build.query<HealthCheckGetApiResponse, HealthCheckGetApiArg>({
        query: () => ({ url: `/` }),
      }),
      registerUserAuthRegisterPost: build.mutation<
        RegisterUserAuthRegisterPostApiResponse,
        RegisterUserAuthRegisterPostApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/register`,
          method: "POST",
          body: queryArg.userCreate,
        }),
        invalidatesTags: ["Authentication"],
      }),
      loginUserAuthLoginPost: build.mutation<LoginUserAuthLoginPostApiResponse, LoginUserAuthLoginPostApiArg>({
        query: (queryArg) => ({
          url: `/auth/login`,
          method: "POST",
          body: queryArg.userLogin,
        }),
        invalidatesTags: ["Authentication"],
      }),
      getCurrentUserProfileAuthMeGet: build.query<
        GetCurrentUserProfileAuthMeGetApiResponse,
        GetCurrentUserProfileAuthMeGetApiArg
      >({
        query: () => ({ url: `/auth/me` }),
        providesTags: ["Authentication"],
      }),
      updateCurrentUserProfileAuthMePut: build.mutation<
        UpdateCurrentUserProfileAuthMePutApiResponse,
        UpdateCurrentUserProfileAuthMePutApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/me`,
          method: "PUT",
          body: queryArg.userUpdate,
        }),
        invalidatesTags: ["Authentication"],
      }),
      refreshAccessTokenAuthRefreshPost: build.mutation<
        RefreshAccessTokenAuthRefreshPostApiResponse,
        RefreshAccessTokenAuthRefreshPostApiArg
      >({
        query: () => ({ url: `/auth/refresh`, method: "POST" }),
        invalidatesTags: ["Authentication"],
      }),
      changePasswordAuthChangePasswordPost: build.mutation<
        ChangePasswordAuthChangePasswordPostApiResponse,
        ChangePasswordAuthChangePasswordPostApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/change-password`,
          method: "POST",
          body: queryArg.passwordChange,
        }),
        invalidatesTags: ["Authentication"],
      }),
      getCurrentUserInfoUsersMeGet: build.query<
        GetCurrentUserInfoUsersMeGetApiResponse,
        GetCurrentUserInfoUsersMeGetApiArg
      >({
        query: () => ({ url: `/users/me` }),
        providesTags: ["User Management"],
      }),
      getUserUsersUserIdGet: build.query<GetUserUsersUserIdGetApiResponse, GetUserUsersUserIdGetApiArg>({
        query: (queryArg) => ({ url: `/users/${queryArg.userId}` }),
        providesTags: ["User Management"],
      }),
      listUsersUsersGet: build.query<ListUsersUsersGetApiResponse, ListUsersUsersGetApiArg>({
        query: (queryArg) => ({
          url: `/users`,
          params: {
            skip: queryArg.skip,
            limit: queryArg.limit,
            min_hourly_rate: queryArg.minHourlyRate,
            max_hourly_rate: queryArg.maxHourlyRate,
            min_experience: queryArg.minExperience,
            max_experience: queryArg.maxExperience,
            skills: queryArg.skills,
            search_query: queryArg.searchQuery,
          },
        }),
        providesTags: ["User Management"],
      }),
      getFilterOptionsUsersFiltersOptionsGet: build.query<
        GetFilterOptionsUsersFiltersOptionsGetApiResponse,
        GetFilterOptionsUsersFiltersOptionsGetApiArg
      >({
        query: () => ({ url: `/users/filters/options` }),
        providesTags: ["User Management"],
      }),
      getUserStatsUsersStatsSummaryGet: build.query<
        GetUserStatsUsersStatsSummaryGetApiResponse,
        GetUserStatsUsersStatsSummaryGetApiArg
      >({
        query: () => ({ url: `/users/stats/summary` }),
        providesTags: ["User Management"],
      }),
      createChatChatsPost: build.mutation<CreateChatChatsPostApiResponse, CreateChatChatsPostApiArg>({
        query: (queryArg) => ({
          url: `/chats/`,
          method: "POST",
          body: queryArg.chatCreate,
        }),
        invalidatesTags: ["Chat Management"],
      }),
      listUserChatsChatsGet: build.query<ListUserChatsChatsGetApiResponse, ListUserChatsChatsGetApiArg>({
        query: (queryArg) => ({
          url: `/chats/`,
          params: {
            is_archived_by_initiator: queryArg.isArchivedByInitiator,
            is_archived_by_participant: queryArg.isArchivedByParticipant,
            page: queryArg.page,
            size: queryArg.size,
          },
        }),
        providesTags: ["Chat Management"],
      }),
      getChatChatsChatIdGet: build.query<GetChatChatsChatIdGetApiResponse, GetChatChatsChatIdGetApiArg>({
        query: (queryArg) => ({ url: `/chats/${queryArg.chatId}` }),
        providesTags: ["Chat Management"],
      }),
      updateChatChatsChatIdPut: build.mutation<UpdateChatChatsChatIdPutApiResponse, UpdateChatChatsChatIdPutApiArg>({
        query: (queryArg) => ({
          url: `/chats/${queryArg.chatId}`,
          method: "PUT",
          body: queryArg.chatUpdate,
        }),
        invalidatesTags: ["Chat Management"],
      }),
      archiveChatChatsChatIdArchivePost: build.mutation<
        ArchiveChatChatsChatIdArchivePostApiResponse,
        ArchiveChatChatsChatIdArchivePostApiArg
      >({
        query: (queryArg) => ({
          url: `/chats/${queryArg.chatId}/archive`,
          method: "POST",
        }),
        invalidatesTags: ["Chat Management"],
      }),
      unarchiveChatChatsChatIdUnarchivePost: build.mutation<
        UnarchiveChatChatsChatIdUnarchivePostApiResponse,
        UnarchiveChatChatsChatIdUnarchivePostApiArg
      >({
        query: (queryArg) => ({
          url: `/chats/${queryArg.chatId}/unarchive`,
          method: "POST",
        }),
        invalidatesTags: ["Chat Management"],
      }),
      getChatStatsChatsStatsSummaryGet: build.query<
        GetChatStatsChatsStatsSummaryGetApiResponse,
        GetChatStatsChatsStatsSummaryGetApiArg
      >({
        query: () => ({ url: `/chats/stats/summary` }),
        providesTags: ["Chat Management"],
      }),
      sendMessageMessagesPost: build.mutation<SendMessageMessagesPostApiResponse, SendMessageMessagesPostApiArg>({
        query: (queryArg) => ({
          url: `/messages/`,
          method: "POST",
          body: queryArg.messageCreate,
        }),
        invalidatesTags: ["Message Management"],
      }),
      getChatMessagesMessagesChatChatIdGet: build.query<
        GetChatMessagesMessagesChatChatIdGetApiResponse,
        GetChatMessagesMessagesChatChatIdGetApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/chat/${queryArg.chatId}`,
          params: {
            page: queryArg.page,
            size: queryArg.size,
          },
        }),
        providesTags: ["Message Management"],
      }),
      getMessageMessagesMessageIdGet: build.query<
        GetMessageMessagesMessageIdGetApiResponse,
        GetMessageMessagesMessageIdGetApiArg
      >({
        query: (queryArg) => ({ url: `/messages/${queryArg.messageId}` }),
        providesTags: ["Message Management"],
      }),
      searchMessagesMessagesSearchGet: build.query<
        SearchMessagesMessagesSearchGetApiResponse,
        SearchMessagesMessagesSearchGetApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/search`,
          params: {
            query: queryArg.query,
            chat_id: queryArg.chatId,
            sender_id: queryArg.senderId,
            page: queryArg.page,
            size: queryArg.size,
          },
        }),
        providesTags: ["Message Management"],
      }),
      createPaymentIntentPaymentsCreatePaymentIntentPost: build.mutation<
        CreatePaymentIntentPaymentsCreatePaymentIntentPostApiResponse,
        CreatePaymentIntentPaymentsCreatePaymentIntentPostApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/create-payment-intent`,
          method: "POST",
          body: queryArg.paymentIntentCreate,
        }),
        invalidatesTags: ["payments"],
      }),
      getPaymentIntentPaymentsPaymentIntentPaymentIntentIdGet: build.query<
        GetPaymentIntentPaymentsPaymentIntentPaymentIntentIdGetApiResponse,
        GetPaymentIntentPaymentsPaymentIntentPaymentIntentIdGetApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/payment-intent/${queryArg.paymentIntentId}`,
        }),
        providesTags: ["payments"],
      }),
      getUserPaymentsPaymentsUserPaymentsGet: build.query<
        GetUserPaymentsPaymentsUserPaymentsGetApiResponse,
        GetUserPaymentsPaymentsUserPaymentsGetApiArg
      >({
        query: () => ({ url: `/payments/user-payments` }),
        providesTags: ["payments"],
      }),
      stripeWebhookPaymentsWebhookPost: build.mutation<
        StripeWebhookPaymentsWebhookPostApiResponse,
        StripeWebhookPaymentsWebhookPostApiArg
      >({
        query: () => ({ url: `/payments/webhook`, method: "POST" }),
        invalidatesTags: ["payments"],
      }),
      getReceiptUrlPaymentsReceiptPaymentIdGet: build.query<
        GetReceiptUrlPaymentsReceiptPaymentIdGetApiResponse,
        GetReceiptUrlPaymentsReceiptPaymentIdGetApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/receipt/${queryArg.paymentId}`,
        }),
        providesTags: ["payments"],
      }),
      getPaymentConfigPaymentsConfigGet: build.query<
        GetPaymentConfigPaymentsConfigGetApiResponse,
        GetPaymentConfigPaymentsConfigGetApiArg
      >({
        query: () => ({ url: `/payments/config` }),
        providesTags: ["payments"],
      }),
      checkPaymentStatusPaymentsCheckPaymentStatusPost: build.mutation<
        CheckPaymentStatusPaymentsCheckPaymentStatusPostApiResponse,
        CheckPaymentStatusPaymentsCheckPaymentStatusPostApiArg
      >({
        query: () => ({
          url: `/payments/check-payment-status`,
          method: "POST",
        }),
        invalidatesTags: ["payments"],
      }),
      manualPaymentUpdatePaymentsManualPaymentUpdatePaymentIntentIdPost: build.mutation<
        ManualPaymentUpdatePaymentsManualPaymentUpdatePaymentIntentIdPostApiResponse,
        ManualPaymentUpdatePaymentsManualPaymentUpdatePaymentIntentIdPostApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/manual-payment-update/${queryArg.paymentIntentId}`,
          method: "POST",
        }),
        invalidatesTags: ["payments"],
      }),
      getChatStatusWsStatusChatIdGet: build.query<
        GetChatStatusWsStatusChatIdGetApiResponse,
        GetChatStatusWsStatusChatIdGetApiArg
      >({
        query: (queryArg) => ({ url: `/ws/status/${queryArg.chatId}` }),
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as appApis };
export type HealthCheckGetApiResponse = /** status 200 Successful Response */ ResponseModelHealthBase;
export type HealthCheckGetApiArg = void;
export type RegisterUserAuthRegisterPostApiResponse = /** status 201 Successful Response */ UserWithToken;
export type RegisterUserAuthRegisterPostApiArg = {
  userCreate: UserCreate;
};
export type LoginUserAuthLoginPostApiResponse = /** status 200 Successful Response */ LoginResponse;
export type LoginUserAuthLoginPostApiArg = {
  userLogin: UserLogin;
};
export type GetCurrentUserProfileAuthMeGetApiResponse = /** status 200 Successful Response */ UserRead;
export type GetCurrentUserProfileAuthMeGetApiArg = void;
export type UpdateCurrentUserProfileAuthMePutApiResponse = /** status 200 Successful Response */ UserRead;
export type UpdateCurrentUserProfileAuthMePutApiArg = {
  userUpdate: UserUpdate;
};
export type RefreshAccessTokenAuthRefreshPostApiResponse = /** status 200 Successful Response */ UserWithToken;
export type RefreshAccessTokenAuthRefreshPostApiArg = void;
export type ChangePasswordAuthChangePasswordPostApiResponse = /** status 200 Successful Response */ object;
export type ChangePasswordAuthChangePasswordPostApiArg = {
  passwordChange: PasswordChange;
};
export type GetCurrentUserInfoUsersMeGetApiResponse = /** status 200 Successful Response */ UserRead;
export type GetCurrentUserInfoUsersMeGetApiArg = void;
export type GetUserUsersUserIdGetApiResponse = /** status 200 Successful Response */ ComprehensiveUserResponse;
export type GetUserUsersUserIdGetApiArg = {
  userId: number;
};
export type ListUsersUsersGetApiResponse = /** status 200 Successful Response */ DashboardFreelancerResponse[];
export type ListUsersUsersGetApiArg = {
  skip?: number;
  limit?: number;
  minHourlyRate?: number | null;
  maxHourlyRate?: number | null;
  minExperience?: number | null;
  maxExperience?: number | null;
  skills?: string | null;
  searchQuery?: string | null;
};
export type GetFilterOptionsUsersFiltersOptionsGetApiResponse =
  /** status 200 Successful Response */ FilterOptionsResponse;
export type GetFilterOptionsUsersFiltersOptionsGetApiArg = void;
export type GetUserStatsUsersStatsSummaryGetApiResponse = /** status 200 Successful Response */ UserStatsResponse;
export type GetUserStatsUsersStatsSummaryGetApiArg = void;
export type CreateChatChatsPostApiResponse = /** status 201 Successful Response */ ChatRead;
export type CreateChatChatsPostApiArg = {
  chatCreate: ChatCreate;
};
export type ListUserChatsChatsGetApiResponse = /** status 200 Successful Response */ ChatList;
export type ListUserChatsChatsGetApiArg = {
  /** Filter by archive status for initiator */
  isArchivedByInitiator?: boolean | null;
  /** Filter by archive status for participant */
  isArchivedByParticipant?: boolean | null;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
};
export type GetChatChatsChatIdGetApiResponse = /** status 200 Successful Response */ ChatWithParticipants;
export type GetChatChatsChatIdGetApiArg = {
  chatId: number;
};
export type UpdateChatChatsChatIdPutApiResponse = /** status 200 Successful Response */ ChatRead;
export type UpdateChatChatsChatIdPutApiArg = {
  chatId: number;
  chatUpdate: ChatUpdate;
};
export type ArchiveChatChatsChatIdArchivePostApiResponse = /** status 200 Successful Response */ ChatRead;
export type ArchiveChatChatsChatIdArchivePostApiArg = {
  chatId: number;
};
export type UnarchiveChatChatsChatIdUnarchivePostApiResponse = /** status 200 Successful Response */ ChatRead;
export type UnarchiveChatChatsChatIdUnarchivePostApiArg = {
  chatId: number;
};
export type GetChatStatsChatsStatsSummaryGetApiResponse = /** status 200 Successful Response */ ChatStats;
export type GetChatStatsChatsStatsSummaryGetApiArg = void;
export type SendMessageMessagesPostApiResponse = /** status 201 Successful Response */ MessageRead;
export type SendMessageMessagesPostApiArg = {
  messageCreate: MessageCreate;
};
export type GetChatMessagesMessagesChatChatIdGetApiResponse = /** status 200 Successful Response */ MessageList;
export type GetChatMessagesMessagesChatChatIdGetApiArg = {
  chatId: number;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
};
export type GetMessageMessagesMessageIdGetApiResponse = /** status 200 Successful Response */ MessageWithSender;
export type GetMessageMessagesMessageIdGetApiArg = {
  messageId: number;
};
export type SearchMessagesMessagesSearchGetApiResponse = /** status 200 Successful Response */ MessageList;
export type SearchMessagesMessagesSearchGetApiArg = {
  /** Search query */
  query: string;
  /** Search within specific chat */
  chatId?: number | null;
  /** Search messages from specific user */
  senderId?: number | null;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
};
export type CreatePaymentIntentPaymentsCreatePaymentIntentPostApiResponse =
  /** status 200 Successful Response */ PaymentIntentResponse;
export type CreatePaymentIntentPaymentsCreatePaymentIntentPostApiArg = {
  paymentIntentCreate: PaymentIntentCreate;
};
export type GetPaymentIntentPaymentsPaymentIntentPaymentIntentIdGetApiResponse =
  /** status 200 Successful Response */ PaymentRead;
export type GetPaymentIntentPaymentsPaymentIntentPaymentIntentIdGetApiArg = {
  paymentIntentId: string;
};
export type GetUserPaymentsPaymentsUserPaymentsGetApiResponse = /** status 200 Successful Response */ PaymentRead[];
export type GetUserPaymentsPaymentsUserPaymentsGetApiArg = void;
export type StripeWebhookPaymentsWebhookPostApiResponse = /** status 200 Successful Response */ WebhookResponse;
export type StripeWebhookPaymentsWebhookPostApiArg = void;
export type GetReceiptUrlPaymentsReceiptPaymentIdGetApiResponse =
  /** status 200 Successful Response */ ReceiptUrlResponse;
export type GetReceiptUrlPaymentsReceiptPaymentIdGetApiArg = {
  paymentId: number;
};
export type GetPaymentConfigPaymentsConfigGetApiResponse = /** status 200 Successful Response */ PaymentConfigResponse;
export type GetPaymentConfigPaymentsConfigGetApiArg = void;
export type CheckPaymentStatusPaymentsCheckPaymentStatusPostApiResponse =
  /** status 200 Successful Response */ PaymentStatusResponse;
export type CheckPaymentStatusPaymentsCheckPaymentStatusPostApiArg = void;
export type ManualPaymentUpdatePaymentsManualPaymentUpdatePaymentIntentIdPostApiResponse =
  /** status 200 Successful Response */ ManualPaymentUpdateResponse;
export type ManualPaymentUpdatePaymentsManualPaymentUpdatePaymentIntentIdPostApiArg = {
  paymentIntentId: string;
};
export type GetChatStatusWsStatusChatIdGetApiResponse = /** status 200 Successful Response */ ChatStatusResponse;
export type GetChatStatusWsStatusChatIdGetApiArg = {
  chatId: string;
};
export type HealthBase = {
  status: string;
  message: string;
};
export type ResponseModelHealthBase = {
  status?: number;
  data?: HealthBase | null;
  message?: string;
};
export type UserRead = {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  id: number;
  profile_picture?: string | null;
  user_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type UserWithToken = {
  user: UserRead;
  access_token: string;
  token_type: string;
};
export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};
export type HttpValidationError = {
  detail?: ValidationError[];
};
export type UserCreate = {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  password: string;
  user_type: string;
  image_url?: string | null;
  country?: string | null;
};
export type LoginUserResponse = {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  image_url?: string | null;
  account_status: string;
  user_type: string;
  payment_status?: string | null;
};
export type LoginResponse = {
  access_token: string;
  user: LoginUserResponse;
};
export type UserLogin = {
  email: string;
  password: string;
};
export type UserUpdate = {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  profile_picture?: string | null;
  is_active?: boolean | null;
};
export type PasswordChange = {
  current_password: string;
  new_password: string;
};
export type FreelancerProfileSummary = {
  id: number;
  title: string;
  bio?: string | null;
  hourly_rate: number;
  years_of_experience: number;
  skills: string[];
  portfolio_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  is_available: boolean;
  country?: string | null;
  created_at: string;
  updated_at: string;
};
export type ClientHunterProfileSummary = {
  id: number;
  first_name: string;
  last_name: string;
  country: string;
  is_paid: boolean;
  payment_date?: string | null;
  created_at: string;
  updated_at: string;
};
export type ProjectSummary = {
  id: number;
  title: string;
  description?: string | null;
  url?: string | null;
  cover_image?: string | null;
  earned: number;
  time_taken?: string | null;
  created_at: string;
  updated_at: string;
};
export type ComprehensiveUserResponse = {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  id: number;
  profile_picture?: string | null;
  user_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  freelancer_profile?: FreelancerProfileSummary | null;
  client_hunter_profile?: ClientHunterProfileSummary | null;
  projects?: ProjectSummary[] | null;
};
export type DashboardFreelancerResponse = {
  freelancer_image?: string | null;
  freelancer_position: string;
  freelancer_rate: number;
  freelancer_experience: number;
  skills: string[];
  user_id: number;
  freelancer_id: number;
  freelancer_first_name: string;
  freelancer_last_name: string;
};
export type FilterOptionsResponse = {
  skills: string[];
  hourly_rate_range: object;
  experience_range: object;
};
export type UserStatsResponse = {
  total_users: number;
  client_hunters: number;
  freelancers: number;
  active_users: number;
};
export type ChatRead = {
  /** Project title */
  project_title?: string | null;
  /** Project description */
  project_description?: string | null;
  /** Project budget range */
  project_budget?: string | null;
  id: number;
  initiator_id: number;
  participant_id: number;
  is_archived_by_initiator: boolean;
  is_archived_by_participant: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ChatCreate = {
  /** Project title */
  project_title?: string | null;
  /** Project description */
  project_description?: string | null;
  /** Project budget range */
  project_budget?: string | null;
  /** ID of the user to start chat with */
  participant_id: number;
};
export type UserType = "client_hunter" | "freelancer";
export type ChatWithParticipants = {
  /** Project title */
  project_title?: string | null;
  /** Project description */
  project_description?: string | null;
  /** Project budget range */
  project_budget?: string | null;
  id: number;
  initiator_id: number;
  participant_id: number;
  is_archived_by_initiator: boolean;
  is_archived_by_participant: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  initiator_name: string;
  participant_name: string;
  initiator_type: UserType;
  participant_type: UserType;
  unread_count?: number;
  last_message_preview?: string | null;
};
export type ChatList = {
  chats: ChatWithParticipants[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
};
export type ChatUpdate = {
  is_archived_by_initiator?: boolean | null;
  is_archived_by_participant?: boolean | null;
};
export type ChatStats = {
  total_chats: number;
  active_chats: number;
  archived_chats: number;
  total_messages: number;
  unread_messages: number;
  chats_this_month: number;
  messages_this_month: number;
};
export type MessageRead = {
  /** Message content */
  content: string;
  /** Message type */
  content_type?: string;
  id: number;
  chat_id: number;
  sender_id: number;
  created_at: string;
  updated_at: string;
};
export type MessageCreate = {
  /** Message content */
  content: string;
  /** Message type */
  content_type?: string;
  /** ID of the chat to send message to */
  chat_id: number;
};
export type MessageWithSender = {
  /** Message content */
  content: string;
  /** Message type */
  content_type?: string;
  id: number;
  chat_id: number;
  sender_id: number;
  created_at: string;
  updated_at: string;
  sender_name: string;
  sender_type: UserType;
  sender_avatar: string | null;
};
export type MessageList = {
  messages: MessageWithSender[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
};
export type PaymentIntentResponse = {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
};
export type PaymentIntentCreate = {
  /** Amount in cents */
  amount: number;
  /** Currency code */
  currency?: string;
  /** Payment description */
  description?: string | null;
  /** Additional metadata */
  metadata?: object | null;
};
export type PaymentRead = {
  id: number;
  user_id: number;
  stripe_payment_intent_id: string;
  stripe_customer_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string | null;
  description?: string | null;
  payment_metadata?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  canceled_at?: string | null;
  refunded?: boolean;
  refunded_at?: string | null;
  refund_amount?: number | null;
  created_at: string;
  updated_at: string;
};
export type WebhookResponse = {
  status: string;
};
export type ReceiptUrlResponse = {
  receipt_url: string;
};
export type PaymentConfigResponse = {
  publishable_key: string;
  platform_fee_amount: number;
  currency: string;
};
export type PaymentStatusResponse = {
  has_paid: boolean;
  payment_status: string;
};
export type ManualPaymentUpdateResponse = {
  status: string;
  message: string;
};
export type ChatStatusResponse = {
  chat_id: string;
  online_users: number[];
  connection_count: number;
};
export const {
  useHealthCheckGetQuery,
  useRegisterUserAuthRegisterPostMutation,
  useLoginUserAuthLoginPostMutation,
  useGetCurrentUserProfileAuthMeGetQuery,
  useUpdateCurrentUserProfileAuthMePutMutation,
  useRefreshAccessTokenAuthRefreshPostMutation,
  useChangePasswordAuthChangePasswordPostMutation,
  useGetCurrentUserInfoUsersMeGetQuery,
  useGetUserUsersUserIdGetQuery,
  useListUsersUsersGetQuery,
  useGetFilterOptionsUsersFiltersOptionsGetQuery,
  useGetUserStatsUsersStatsSummaryGetQuery,
  useCreateChatChatsPostMutation,
  useListUserChatsChatsGetQuery,
  useGetChatChatsChatIdGetQuery,
  useUpdateChatChatsChatIdPutMutation,
  useArchiveChatChatsChatIdArchivePostMutation,
  useUnarchiveChatChatsChatIdUnarchivePostMutation,
  useGetChatStatsChatsStatsSummaryGetQuery,
  useSendMessageMessagesPostMutation,
  useGetChatMessagesMessagesChatChatIdGetQuery,
  useGetMessageMessagesMessageIdGetQuery,
  useSearchMessagesMessagesSearchGetQuery,
  useCreatePaymentIntentPaymentsCreatePaymentIntentPostMutation,
  useGetPaymentIntentPaymentsPaymentIntentPaymentIntentIdGetQuery,
  useGetUserPaymentsPaymentsUserPaymentsGetQuery,
  useStripeWebhookPaymentsWebhookPostMutation,
  useGetReceiptUrlPaymentsReceiptPaymentIdGetQuery,
  useGetPaymentConfigPaymentsConfigGetQuery,
  useCheckPaymentStatusPaymentsCheckPaymentStatusPostMutation,
  useManualPaymentUpdatePaymentsManualPaymentUpdatePaymentIntentIdPostMutation,
  useGetChatStatusWsStatusChatIdGetQuery,
} = injectedRtkApi;
