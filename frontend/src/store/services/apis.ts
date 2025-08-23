import { api } from "./core";
export const addTagTypes = [
  "Authentication",
  "User Management",
  "Chat Management",
  "Message Management",
  "Payments",
  "WebSocket Chat",
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
      listUsersUsersGet: build.query<ListUsersUsersGetApiResponse, ListUsersUsersGetApiArg>({
        query: (queryArg) => ({
          url: `/users/`,
          params: {
            user_type: queryArg.userType,
            is_active: queryArg.isActive,
            is_verified: queryArg.isVerified,
            min_hourly_rate: queryArg.minHourlyRate,
            max_hourly_rate: queryArg.maxHourlyRate,
            min_experience: queryArg.minExperience,
            max_experience: queryArg.maxExperience,
            skills: queryArg.skills,
            technologies: queryArg.technologies,
            work_type: queryArg.workType,
            search_query: queryArg.searchQuery,
            skip: queryArg.skip,
            limit: queryArg.limit,
          },
        }),
        providesTags: ["User Management"],
      }),
      getUserUsersUserIdGet: build.query<GetUserUsersUserIdGetApiResponse, GetUserUsersUserIdGetApiArg>({
        query: (queryArg) => ({ url: `/users/${queryArg.userId}` }),
        providesTags: ["User Management"],
      }),
      updateUserUsersUserIdPut: build.mutation<UpdateUserUsersUserIdPutApiResponse, UpdateUserUsersUserIdPutApiArg>({
        query: (queryArg) => ({
          url: `/users/${queryArg.userId}`,
          method: "PUT",
          body: queryArg.userUpdate,
        }),
        invalidatesTags: ["User Management"],
      }),
      deleteUserUsersUserIdDelete: build.mutation<
        DeleteUserUsersUserIdDeleteApiResponse,
        DeleteUserUsersUserIdDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.userId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["User Management"],
      }),
      getFreelancerProfileUsersUserIdFreelancerProfileGet: build.query<
        GetFreelancerProfileUsersUserIdFreelancerProfileGetApiResponse,
        GetFreelancerProfileUsersUserIdFreelancerProfileGetApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.userId}/freelancer-profile`,
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
      verifyUserUsersUserIdVerifyPost: build.mutation<
        VerifyUserUsersUserIdVerifyPostApiResponse,
        VerifyUserUsersUserIdVerifyPostApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.userId}/verify`,
          method: "POST",
        }),
        invalidatesTags: ["User Management"],
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
            status_filter: queryArg.statusFilter,
            is_archived: queryArg.isArchived,
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
      deleteChatChatsChatIdDelete: build.mutation<
        DeleteChatChatsChatIdDeleteApiResponse,
        DeleteChatChatsChatIdDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/chats/${queryArg.chatId}`,
          method: "DELETE",
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
      editMessageMessagesMessageIdPut: build.mutation<
        EditMessageMessagesMessageIdPutApiResponse,
        EditMessageMessagesMessageIdPutApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/${queryArg.messageId}`,
          method: "PUT",
          body: queryArg.messageUpdate,
        }),
        invalidatesTags: ["Message Management"],
      }),
      deleteMessageMessagesMessageIdDelete: build.mutation<
        DeleteMessageMessagesMessageIdDeleteApiResponse,
        DeleteMessageMessagesMessageIdDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/${queryArg.messageId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Message Management"],
      }),
      searchMessagesMessagesSearchGet: build.query<
        SearchMessagesMessagesSearchGetApiResponse,
        SearchMessagesMessagesSearchGetApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/search/`,
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
      flagMessageMessagesMessageIdFlagPost: build.mutation<
        FlagMessageMessagesMessageIdFlagPostApiResponse,
        FlagMessageMessagesMessageIdFlagPostApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/${queryArg.messageId}/flag`,
          method: "POST",
          params: {
            reason: queryArg.reason,
          },
        }),
        invalidatesTags: ["Message Management"],
      }),
      createPaymentOrderPaymentsCreateOrderPost: build.mutation<
        CreatePaymentOrderPaymentsCreateOrderPostApiResponse,
        CreatePaymentOrderPaymentsCreateOrderPostApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/create-order`,
          method: "POST",
          body: queryArg.paymentCreate,
        }),
        invalidatesTags: ["Payments"],
      }),
      capturePaymentPaymentsCapturePaymentIdPost: build.mutation<
        CapturePaymentPaymentsCapturePaymentIdPostApiResponse,
        CapturePaymentPaymentsCapturePaymentIdPostApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/capture/${queryArg.paymentId}`,
          method: "POST",
        }),
        invalidatesTags: ["Payments"],
      }),
      getPaymentPaymentsPaymentIdGet: build.query<
        GetPaymentPaymentsPaymentIdGetApiResponse,
        GetPaymentPaymentsPaymentIdGetApiArg
      >({
        query: (queryArg) => ({ url: `/payments/${queryArg.paymentId}` }),
        providesTags: ["Payments"],
      }),
      getUserPaymentsPaymentsUserPaymentsGet: build.query<
        GetUserPaymentsPaymentsUserPaymentsGetApiResponse,
        GetUserPaymentsPaymentsUserPaymentsGetApiArg
      >({
        query: () => ({ url: `/payments/user/payments` }),
        providesTags: ["Payments"],
      }),
      paypalWebhookPaymentsWebhookPaypalPost: build.mutation<
        PaypalWebhookPaymentsWebhookPaypalPostApiResponse,
        PaypalWebhookPaymentsWebhookPaypalPostApiArg
      >({
        query: () => ({ url: `/payments/webhook/paypal`, method: "POST" }),
        invalidatesTags: ["Payments"],
      }),
      getOnlineUsersOnlineUsersGet: build.query<
        GetOnlineUsersOnlineUsersGetApiResponse,
        GetOnlineUsersOnlineUsersGetApiArg
      >({
        query: () => ({ url: `/online-users` }),
        providesTags: ["WebSocket Chat"],
      }),
      getUserStatusUserStatusUserIdGet: build.query<
        GetUserStatusUserStatusUserIdGetApiResponse,
        GetUserStatusUserStatusUserIdGetApiArg
      >({
        query: (queryArg) => ({ url: `/user-status/${queryArg.userId}` }),
        providesTags: ["WebSocket Chat"],
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
export type LoginUserAuthLoginPostApiResponse = /** status 200 Successful Response */ UserWithToken;
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
export type ListUsersUsersGetApiResponse = /** status 200 Successful Response */ UserRead[];
export type ListUsersUsersGetApiArg = {
  /** Filter by user type */
  userType?: UserType | null;
  /** Filter by active status */
  isActive?: boolean | null;
  /** Filter by verification status */
  isVerified?: boolean | null;
  /** Minimum hourly rate (0-10000) */
  minHourlyRate?: number | null;
  /** Maximum hourly rate (0-10000) */
  maxHourlyRate?: number | null;
  /** Minimum years of experience (0-100) */
  minExperience?: number | null;
  /** Maximum years of experience (0-100) */
  maxExperience?: number | null;
  /** Comma-separated list of skills to filter by */
  skills?: string | null;
  /** Comma-separated list of technologies to filter by */
  technologies?: string | null;
  /** Preferred work type (remote, onsite, hybrid) */
  workType?: string | null;
  /** Search query for name, title, or bio */
  searchQuery?: string | null;
  /** Number of records to skip */
  skip?: number;
  /** Maximum number of records to return */
  limit?: number;
};
export type GetUserUsersUserIdGetApiResponse = /** status 200 Successful Response */ UserRead;
export type GetUserUsersUserIdGetApiArg = {
  userId: number;
};
export type UpdateUserUsersUserIdPutApiResponse = /** status 200 Successful Response */ UserRead;
export type UpdateUserUsersUserIdPutApiArg = {
  userId: number;
  userUpdate: UserUpdate;
};
export type DeleteUserUsersUserIdDeleteApiResponse = unknown;
export type DeleteUserUsersUserIdDeleteApiArg = {
  userId: number;
};
export type GetFreelancerProfileUsersUserIdFreelancerProfileGetApiResponse =
  /** status 200 Successful Response */ FreelancerRead;
export type GetFreelancerProfileUsersUserIdFreelancerProfileGetApiArg = {
  userId: number;
};
export type GetFilterOptionsUsersFiltersOptionsGetApiResponse = /** status 200 Successful Response */ object;
export type GetFilterOptionsUsersFiltersOptionsGetApiArg = void;
export type VerifyUserUsersUserIdVerifyPostApiResponse = /** status 200 Successful Response */ UserRead;
export type VerifyUserUsersUserIdVerifyPostApiArg = {
  userId: number;
};
export type GetUserStatsUsersStatsSummaryGetApiResponse = /** status 200 Successful Response */ UserStatsSummary;
export type GetUserStatsUsersStatsSummaryGetApiArg = void;
export type CreateChatChatsPostApiResponse = /** status 201 Successful Response */ ChatRead;
export type CreateChatChatsPostApiArg = {
  chatCreate: ChatCreate;
};
export type ListUserChatsChatsGetApiResponse = /** status 200 Successful Response */ ChatList;
export type ListUserChatsChatsGetApiArg = {
  /** Filter by chat status */
  statusFilter?: string | null;
  /** Filter by archive status */
  isArchived?: boolean | null;
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
export type DeleteChatChatsChatIdDeleteApiResponse = unknown;
export type DeleteChatChatsChatIdDeleteApiArg = {
  chatId: number;
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
export type EditMessageMessagesMessageIdPutApiResponse = /** status 200 Successful Response */ MessageRead;
export type EditMessageMessagesMessageIdPutApiArg = {
  messageId: number;
  messageUpdate: MessageUpdate;
};
export type DeleteMessageMessagesMessageIdDeleteApiResponse = unknown;
export type DeleteMessageMessagesMessageIdDeleteApiArg = {
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
export type FlagMessageMessagesMessageIdFlagPostApiResponse = /** status 200 Successful Response */ MessageRead;
export type FlagMessageMessagesMessageIdFlagPostApiArg = {
  messageId: number;
  /** Flag reason */
  reason: string;
};
export type CreatePaymentOrderPaymentsCreateOrderPostApiResponse =
  /** status 200 Successful Response */ PayPalOrderResponse;
export type CreatePaymentOrderPaymentsCreateOrderPostApiArg = {
  paymentCreate: PaymentCreate;
};
export type CapturePaymentPaymentsCapturePaymentIdPostApiResponse =
  /** status 200 Successful Response */ PaymentCaptureResponse;
export type CapturePaymentPaymentsCapturePaymentIdPostApiArg = {
  paymentId: number;
};
export type GetPaymentPaymentsPaymentIdGetApiResponse = /** status 200 Successful Response */ PaymentRead;
export type GetPaymentPaymentsPaymentIdGetApiArg = {
  paymentId: number;
};
export type GetUserPaymentsPaymentsUserPaymentsGetApiResponse = /** status 200 Successful Response */ PaymentRead[];
export type GetUserPaymentsPaymentsUserPaymentsGetApiArg = void;
export type PaypalWebhookPaymentsWebhookPaypalPostApiResponse = /** status 200 Successful Response */ WebhookResponse;
export type PaypalWebhookPaymentsWebhookPaypalPostApiArg = void;
export type GetOnlineUsersOnlineUsersGetApiResponse = /** status 200 Successful Response */ OnlineUsersResponse;
export type GetOnlineUsersOnlineUsersGetApiArg = void;
export type GetUserStatusUserStatusUserIdGetApiResponse = /** status 200 Successful Response */ UserStatusResponse;
export type GetUserStatusUserStatusUserIdGetApiArg = {
  userId: number;
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
export type UserType = "client_hunter" | "freelancer";
export type UserRead = {
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
  id: number;
  user_type: UserType;
  is_active: boolean;
  is_verified: boolean;
  has_paid: boolean;
  payment_date?: string | null;
  payment_amount?: number | null;
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
  profile_picture?: string | null;
  password: string;
  user_type: UserType;
};
export type UserLogin = {
  email: string;
  password: string;
};
export type UserUpdate = {
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  current_password?: string | null;
  new_password?: string | null;
  has_paid?: boolean | null;
  payment_date?: string | null;
  payment_amount?: number | null;
};
export type FreelancerRead = {
  title: string;
  bio?: string | null;
  hourly_rate: number;
  daily_rate?: number | null;
  years_of_experience: number;
  skills?: string[];
  technologies?: string[];
  portfolio_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  is_available?: boolean;
  preferred_work_type?: string[];
  timezone?: string | null;
  id: number;
  user_id: number;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
};
export type UserStatsSummary = {
  total_users: number;
  client_hunters: number;
  freelancers: number;
  active_users: number;
  verified_users: number;
  verification_rate: number;
};
export type ChatRead = {
  /** Chat title */
  title?: string | null;
  /** Project title */
  project_title?: string | null;
  /** Project description */
  project_description?: string | null;
  /** Project budget range */
  project_budget?: string | null;
  id: number;
  initiator_id: number;
  participant_id: number;
  is_archived: boolean;
  is_deleted: boolean;
  status: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ChatCreate = {
  /** Chat title */
  title?: string | null;
  /** Project title */
  project_title?: string | null;
  /** Project description */
  project_description?: string | null;
  /** Project budget range */
  project_budget?: string | null;
  /** ID of the user to start chat with */
  participant_id: number;
};
export type ChatWithParticipants = {
  /** Chat title */
  title?: string | null;
  /** Project title */
  project_title?: string | null;
  /** Project description */
  project_description?: string | null;
  /** Project budget range */
  project_budget?: string | null;
  id: number;
  initiator_id: number;
  participant_id: number;
  is_archived: boolean;
  is_deleted: boolean;
  status: string;
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
  title?: string | null;
  /** Project title */
  project_title?: string | null;
  /** Project description */
  project_description?: string | null;
  /** Project budget range */
  project_budget?: string | null;
  is_archived?: boolean | null;
  status?: string | null;
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
  is_flagged: boolean;
  flag_reason: string | null;
  is_edited: boolean;
  original_content: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  edited_at: string | null;
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
  is_flagged: boolean;
  flag_reason: string | null;
  is_edited: boolean;
  original_content: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  edited_at: string | null;
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
export type MessageUpdate = {
  /** New message content */
  content: string;
};
export type PayPalOrderResponse = {
  payment_id: number;
  paypal_order_id: string;
  approval_url: string;
  amount: string;
  currency: string;
};
export type PaymentMethod = "paypal" | "stripe" | "bank_transfer";
export type PaymentCreate = {
  /** Payment amount */
  amount: number | string;
  /** Payment currency */
  currency?: string;
  /** Payment description */
  description: string;
  payment_method?: PaymentMethod;
};
export type PaymentStatus = "pending" | "approved" | "completed" | "failed" | "cancelled" | "refunded";
export type PaymentCaptureResponse = {
  message: string;
  payment_id: number;
  status: PaymentStatus;
};
export type PaymentRead = {
  id: number;
  user_id: number;
  amount: string;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
};
export type WebhookResponse = {
  status: string;
};
export type OnlineUsersResponse = {
  online_users: number[];
  total_online: number;
};
export type UserStatusResponse = {
  user_id: number;
  is_online: boolean;
};
export const {
  useHealthCheckGetQuery,
  useRegisterUserAuthRegisterPostMutation,
  useLoginUserAuthLoginPostMutation,
  useGetCurrentUserProfileAuthMeGetQuery,
  useUpdateCurrentUserProfileAuthMePutMutation,
  useRefreshAccessTokenAuthRefreshPostMutation,
  useListUsersUsersGetQuery,
  useGetUserUsersUserIdGetQuery,
  useUpdateUserUsersUserIdPutMutation,
  useDeleteUserUsersUserIdDeleteMutation,
  useGetFreelancerProfileUsersUserIdFreelancerProfileGetQuery,
  useGetFilterOptionsUsersFiltersOptionsGetQuery,
  useVerifyUserUsersUserIdVerifyPostMutation,
  useGetUserStatsUsersStatsSummaryGetQuery,
  useCreateChatChatsPostMutation,
  useListUserChatsChatsGetQuery,
  useGetChatChatsChatIdGetQuery,
  useUpdateChatChatsChatIdPutMutation,
  useDeleteChatChatsChatIdDeleteMutation,
  useArchiveChatChatsChatIdArchivePostMutation,
  useUnarchiveChatChatsChatIdUnarchivePostMutation,
  useGetChatStatsChatsStatsSummaryGetQuery,
  useSendMessageMessagesPostMutation,
  useGetChatMessagesMessagesChatChatIdGetQuery,
  useGetMessageMessagesMessageIdGetQuery,
  useEditMessageMessagesMessageIdPutMutation,
  useDeleteMessageMessagesMessageIdDeleteMutation,
  useSearchMessagesMessagesSearchGetQuery,
  useFlagMessageMessagesMessageIdFlagPostMutation,
  useCreatePaymentOrderPaymentsCreateOrderPostMutation,
  useCapturePaymentPaymentsCapturePaymentIdPostMutation,
  useGetPaymentPaymentsPaymentIdGetQuery,
  useGetUserPaymentsPaymentsUserPaymentsGetQuery,
  usePaypalWebhookPaymentsWebhookPaypalPostMutation,
  useGetOnlineUsersOnlineUsersGetQuery,
  useGetUserStatusUserStatusUserIdGetQuery,
} = injectedRtkApi;
