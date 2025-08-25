import { api } from "./core";
export const addTagTypes = [
  "Authentication",
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
      registerUserAuthAuthRegisterPost: build.mutation<
        RegisterUserAuthAuthRegisterPostApiResponse,
        RegisterUserAuthAuthRegisterPostApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/auth/register`,
          method: "POST",
          body: queryArg.userCreate,
        }),
        invalidatesTags: ["Authentication"],
      }),
      loginUserAuthAuthLoginPost: build.mutation<
        LoginUserAuthAuthLoginPostApiResponse,
        LoginUserAuthAuthLoginPostApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/auth/login`,
          method: "POST",
          body: queryArg.userLogin,
        }),
        invalidatesTags: ["Authentication"],
      }),
      getCurrentUserProfileAuthAuthMeGet: build.query<
        GetCurrentUserProfileAuthAuthMeGetApiResponse,
        GetCurrentUserProfileAuthAuthMeGetApiArg
      >({
        query: () => ({ url: `/auth/auth/me` }),
        providesTags: ["Authentication"],
      }),
      updateCurrentUserProfileAuthAuthMePut: build.mutation<
        UpdateCurrentUserProfileAuthAuthMePutApiResponse,
        UpdateCurrentUserProfileAuthAuthMePutApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/auth/me`,
          method: "PUT",
          body: queryArg.userUpdate,
        }),
        invalidatesTags: ["Authentication"],
      }),
      refreshAccessTokenAuthAuthRefreshPost: build.mutation<
        RefreshAccessTokenAuthAuthRefreshPostApiResponse,
        RefreshAccessTokenAuthAuthRefreshPostApiArg
      >({
        query: () => ({ url: `/auth/auth/refresh`, method: "POST" }),
        invalidatesTags: ["Authentication"],
      }),
      getCurrentUserInfoUsersMeGet: build.query<
        GetCurrentUserInfoUsersMeGetApiResponse,
        GetCurrentUserInfoUsersMeGetApiArg
      >({
        query: () => ({ url: `/users/me` }),
      }),
      updateCurrentUserUsersMePut: build.mutation<
        UpdateCurrentUserUsersMePutApiResponse,
        UpdateCurrentUserUsersMePutApiArg
      >({
        query: (queryArg) => ({
          url: `/users/me`,
          method: "PUT",
          body: queryArg.userUpdate,
        }),
      }),
      getUserUsersUserIdGet: build.query<GetUserUsersUserIdGetApiResponse, GetUserUsersUserIdGetApiArg>({
        query: (queryArg) => ({ url: `/users/${queryArg.userId}` }),
      }),
      getFreelancerProfileUsersUserIdFreelancerProfileGet: build.query<
        GetFreelancerProfileUsersUserIdFreelancerProfileGetApiResponse,
        GetFreelancerProfileUsersUserIdFreelancerProfileGetApiArg
      >({
        query: (queryArg) => ({
          url: `/users/${queryArg.userId}/freelancer-profile`,
        }),
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
            technologies: queryArg.technologies,
            work_type: queryArg.workType,
            search_query: queryArg.searchQuery,
          },
        }),
      }),
      getFilterOptionsUsersFiltersOptionsGet: build.query<
        GetFilterOptionsUsersFiltersOptionsGetApiResponse,
        GetFilterOptionsUsersFiltersOptionsGetApiArg
      >({
        query: () => ({ url: `/users/filters/options` }),
      }),
      getUserStatsUsersStatsSummaryGet: build.query<
        GetUserStatsUsersStatsSummaryGetApiResponse,
        GetUserStatsUsersStatsSummaryGetApiArg
      >({
        query: () => ({ url: `/users/stats/summary` }),
      }),
      createChatChatsChatsPost: build.mutation<CreateChatChatsChatsPostApiResponse, CreateChatChatsChatsPostApiArg>({
        query: (queryArg) => ({
          url: `/chats/chats/`,
          method: "POST",
          body: queryArg.chatCreate,
        }),
        invalidatesTags: ["Chat Management"],
      }),
      listUserChatsChatsChatsGet: build.query<ListUserChatsChatsChatsGetApiResponse, ListUserChatsChatsChatsGetApiArg>({
        query: (queryArg) => ({
          url: `/chats/chats/`,
          params: {
            status_filter: queryArg.statusFilter,
            is_archived: queryArg.isArchived,
            page: queryArg.page,
            size: queryArg.size,
          },
        }),
        providesTags: ["Chat Management"],
      }),
      getChatChatsChatsChatIdGet: build.query<GetChatChatsChatsChatIdGetApiResponse, GetChatChatsChatsChatIdGetApiArg>({
        query: (queryArg) => ({ url: `/chats/chats/${queryArg.chatId}` }),
        providesTags: ["Chat Management"],
      }),
      updateChatChatsChatsChatIdPut: build.mutation<
        UpdateChatChatsChatsChatIdPutApiResponse,
        UpdateChatChatsChatsChatIdPutApiArg
      >({
        query: (queryArg) => ({
          url: `/chats/chats/${queryArg.chatId}`,
          method: "PUT",
          body: queryArg.chatUpdate,
        }),
        invalidatesTags: ["Chat Management"],
      }),
      deleteChatChatsChatsChatIdDelete: build.mutation<
        DeleteChatChatsChatsChatIdDeleteApiResponse,
        DeleteChatChatsChatsChatIdDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/chats/chats/${queryArg.chatId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Chat Management"],
      }),
      archiveChatChatsChatsChatIdArchivePost: build.mutation<
        ArchiveChatChatsChatsChatIdArchivePostApiResponse,
        ArchiveChatChatsChatsChatIdArchivePostApiArg
      >({
        query: (queryArg) => ({
          url: `/chats/chats/${queryArg.chatId}/archive`,
          method: "POST",
        }),
        invalidatesTags: ["Chat Management"],
      }),
      unarchiveChatChatsChatsChatIdUnarchivePost: build.mutation<
        UnarchiveChatChatsChatsChatIdUnarchivePostApiResponse,
        UnarchiveChatChatsChatsChatIdUnarchivePostApiArg
      >({
        query: (queryArg) => ({
          url: `/chats/chats/${queryArg.chatId}/unarchive`,
          method: "POST",
        }),
        invalidatesTags: ["Chat Management"],
      }),
      getChatStatsChatsChatsStatsSummaryGet: build.query<
        GetChatStatsChatsChatsStatsSummaryGetApiResponse,
        GetChatStatsChatsChatsStatsSummaryGetApiArg
      >({
        query: () => ({ url: `/chats/chats/stats/summary` }),
        providesTags: ["Chat Management"],
      }),
      sendMessageMessagesMessagesPost: build.mutation<
        SendMessageMessagesMessagesPostApiResponse,
        SendMessageMessagesMessagesPostApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/messages/`,
          method: "POST",
          body: queryArg.messageCreate,
        }),
        invalidatesTags: ["Message Management"],
      }),
      getChatMessagesMessagesMessagesChatChatIdGet: build.query<
        GetChatMessagesMessagesMessagesChatChatIdGetApiResponse,
        GetChatMessagesMessagesMessagesChatChatIdGetApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/messages/chat/${queryArg.chatId}`,
          params: {
            page: queryArg.page,
            size: queryArg.size,
          },
        }),
        providesTags: ["Message Management"],
      }),
      getMessageMessagesMessagesMessageIdGet: build.query<
        GetMessageMessagesMessagesMessageIdGetApiResponse,
        GetMessageMessagesMessagesMessageIdGetApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/messages/${queryArg.messageId}`,
        }),
        providesTags: ["Message Management"],
      }),
      editMessageMessagesMessagesMessageIdPut: build.mutation<
        EditMessageMessagesMessagesMessageIdPutApiResponse,
        EditMessageMessagesMessagesMessageIdPutApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/messages/${queryArg.messageId}`,
          method: "PUT",
          body: queryArg.messageUpdate,
        }),
        invalidatesTags: ["Message Management"],
      }),
      deleteMessageMessagesMessagesMessageIdDelete: build.mutation<
        DeleteMessageMessagesMessagesMessageIdDeleteApiResponse,
        DeleteMessageMessagesMessagesMessageIdDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/messages/${queryArg.messageId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Message Management"],
      }),
      searchMessagesMessagesMessagesSearchGet: build.query<
        SearchMessagesMessagesMessagesSearchGetApiResponse,
        SearchMessagesMessagesMessagesSearchGetApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/messages/search`,
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
      flagMessageMessagesMessagesMessageIdFlagPost: build.mutation<
        FlagMessageMessagesMessagesMessageIdFlagPostApiResponse,
        FlagMessageMessagesMessagesMessageIdFlagPostApiArg
      >({
        query: (queryArg) => ({
          url: `/messages/messages/${queryArg.messageId}/flag`,
          method: "POST",
          params: {
            reason: queryArg.reason,
          },
        }),
        invalidatesTags: ["Message Management"],
      }),
      createPaymentOrderPaymentsPaymentsCreateOrderPost: build.mutation<
        CreatePaymentOrderPaymentsPaymentsCreateOrderPostApiResponse,
        CreatePaymentOrderPaymentsPaymentsCreateOrderPostApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/payments/create-order`,
          method: "POST",
          body: queryArg.paymentCreate,
        }),
        invalidatesTags: ["Payments"],
      }),
      capturePaymentPaymentsPaymentsCapturePaymentIdPost: build.mutation<
        CapturePaymentPaymentsPaymentsCapturePaymentIdPostApiResponse,
        CapturePaymentPaymentsPaymentsCapturePaymentIdPostApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/payments/capture/${queryArg.paymentId}`,
          method: "POST",
        }),
        invalidatesTags: ["Payments"],
      }),
      getPaymentPaymentsPaymentsPaymentIdGet: build.query<
        GetPaymentPaymentsPaymentsPaymentIdGetApiResponse,
        GetPaymentPaymentsPaymentsPaymentIdGetApiArg
      >({
        query: (queryArg) => ({
          url: `/payments/payments/${queryArg.paymentId}`,
        }),
        providesTags: ["Payments"],
      }),
      getUserPaymentsPaymentsPaymentsUserPaymentsGet: build.query<
        GetUserPaymentsPaymentsPaymentsUserPaymentsGetApiResponse,
        GetUserPaymentsPaymentsPaymentsUserPaymentsGetApiArg
      >({
        query: () => ({ url: `/payments/payments/user/payments` }),
        providesTags: ["Payments"],
      }),
      paypalWebhookPaymentsPaymentsWebhookPaypalPost: build.mutation<
        PaypalWebhookPaymentsPaymentsWebhookPaypalPostApiResponse,
        PaypalWebhookPaymentsPaymentsWebhookPaypalPostApiArg
      >({
        query: () => ({
          url: `/payments/payments/webhook/paypal`,
          method: "POST",
        }),
        invalidatesTags: ["Payments"],
      }),
      getOnlineUsersWsOnlineUsersGet: build.query<
        GetOnlineUsersWsOnlineUsersGetApiResponse,
        GetOnlineUsersWsOnlineUsersGetApiArg
      >({
        query: () => ({ url: `/ws/online-users` }),
        providesTags: ["WebSocket Chat"],
      }),
      getUserStatusWsUserStatusUserIdGet: build.query<
        GetUserStatusWsUserStatusUserIdGetApiResponse,
        GetUserStatusWsUserStatusUserIdGetApiArg
      >({
        query: (queryArg) => ({ url: `/ws/user-status/${queryArg.userId}` }),
        providesTags: ["WebSocket Chat"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as appApis };
export type HealthCheckGetApiResponse = /** status 200 Successful Response */ ResponseModelHealthBase;
export type HealthCheckGetApiArg = void;
export type RegisterUserAuthAuthRegisterPostApiResponse = /** status 201 Successful Response */ UserWithToken;
export type RegisterUserAuthAuthRegisterPostApiArg = {
  userCreate: UserCreate;
};
export type LoginUserAuthAuthLoginPostApiResponse = /** status 200 Successful Response */ UserWithToken;
export type LoginUserAuthAuthLoginPostApiArg = {
  userLogin: UserLogin;
};
export type GetCurrentUserProfileAuthAuthMeGetApiResponse = /** status 200 Successful Response */ UserRead;
export type GetCurrentUserProfileAuthAuthMeGetApiArg = void;
export type UpdateCurrentUserProfileAuthAuthMePutApiResponse = /** status 200 Successful Response */ UserRead;
export type UpdateCurrentUserProfileAuthAuthMePutApiArg = {
  userUpdate: UserUpdate;
};
export type RefreshAccessTokenAuthAuthRefreshPostApiResponse = /** status 200 Successful Response */ UserWithToken;
export type RefreshAccessTokenAuthAuthRefreshPostApiArg = void;
export type GetCurrentUserInfoUsersMeGetApiResponse = /** status 200 Successful Response */ UserRead;
export type GetCurrentUserInfoUsersMeGetApiArg = void;
export type UpdateCurrentUserUsersMePutApiResponse = /** status 200 Successful Response */ UserRead;
export type UpdateCurrentUserUsersMePutApiArg = {
  userUpdate: UserUpdate;
};
export type GetUserUsersUserIdGetApiResponse = /** status 200 Successful Response */ UserRead;
export type GetUserUsersUserIdGetApiArg = {
  userId: number;
};
export type GetFreelancerProfileUsersUserIdFreelancerProfileGetApiResponse =
  /** status 200 Successful Response */ FreelancerRead;
export type GetFreelancerProfileUsersUserIdFreelancerProfileGetApiArg = {
  userId: number;
};
export type ListUsersUsersGetApiResponse = /** status 200 Successful Response */ UserRead[];
export type ListUsersUsersGetApiArg = {
  skip?: number;
  limit?: number;
  minHourlyRate?: number | null;
  maxHourlyRate?: number | null;
  minExperience?: number | null;
  maxExperience?: number | null;
  skills?: string | null;
  technologies?: string | null;
  workType?: string | null;
  searchQuery?: string | null;
};
export type GetFilterOptionsUsersFiltersOptionsGetApiResponse =
  /** status 200 Successful Response */ FilterOptionsResponse;
export type GetFilterOptionsUsersFiltersOptionsGetApiArg = void;
export type GetUserStatsUsersStatsSummaryGetApiResponse = /** status 200 Successful Response */ UserStatsResponse;
export type GetUserStatsUsersStatsSummaryGetApiArg = void;
export type CreateChatChatsChatsPostApiResponse = /** status 201 Successful Response */ ChatRead;
export type CreateChatChatsChatsPostApiArg = {
  chatCreate: ChatCreate;
};
export type ListUserChatsChatsChatsGetApiResponse = /** status 200 Successful Response */ ChatList;
export type ListUserChatsChatsChatsGetApiArg = {
  /** Filter by chat status */
  statusFilter?: string | null;
  /** Filter by archive status */
  isArchived?: boolean | null;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
};
export type GetChatChatsChatsChatIdGetApiResponse = /** status 200 Successful Response */ ChatWithParticipants;
export type GetChatChatsChatsChatIdGetApiArg = {
  chatId: number;
};
export type UpdateChatChatsChatsChatIdPutApiResponse = /** status 200 Successful Response */ ChatRead;
export type UpdateChatChatsChatsChatIdPutApiArg = {
  chatId: number;
  chatUpdate: ChatUpdate;
};
export type DeleteChatChatsChatsChatIdDeleteApiResponse = unknown;
export type DeleteChatChatsChatsChatIdDeleteApiArg = {
  chatId: number;
};
export type ArchiveChatChatsChatsChatIdArchivePostApiResponse = /** status 200 Successful Response */ ChatRead;
export type ArchiveChatChatsChatsChatIdArchivePostApiArg = {
  chatId: number;
};
export type UnarchiveChatChatsChatsChatIdUnarchivePostApiResponse = /** status 200 Successful Response */ ChatRead;
export type UnarchiveChatChatsChatsChatIdUnarchivePostApiArg = {
  chatId: number;
};
export type GetChatStatsChatsChatsStatsSummaryGetApiResponse = /** status 200 Successful Response */ ChatStats;
export type GetChatStatsChatsChatsStatsSummaryGetApiArg = void;
export type SendMessageMessagesMessagesPostApiResponse = /** status 201 Successful Response */ MessageRead;
export type SendMessageMessagesMessagesPostApiArg = {
  messageCreate: MessageCreate;
};
export type GetChatMessagesMessagesMessagesChatChatIdGetApiResponse = /** status 200 Successful Response */ MessageList;
export type GetChatMessagesMessagesMessagesChatChatIdGetApiArg = {
  chatId: number;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
};
export type GetMessageMessagesMessagesMessageIdGetApiResponse = /** status 200 Successful Response */ MessageWithSender;
export type GetMessageMessagesMessagesMessageIdGetApiArg = {
  messageId: number;
};
export type EditMessageMessagesMessagesMessageIdPutApiResponse = /** status 200 Successful Response */ MessageRead;
export type EditMessageMessagesMessagesMessageIdPutApiArg = {
  messageId: number;
  messageUpdate: MessageUpdate;
};
export type DeleteMessageMessagesMessagesMessageIdDeleteApiResponse = unknown;
export type DeleteMessageMessagesMessagesMessageIdDeleteApiArg = {
  messageId: number;
};
export type SearchMessagesMessagesMessagesSearchGetApiResponse = /** status 200 Successful Response */ MessageList;
export type SearchMessagesMessagesMessagesSearchGetApiArg = {
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
export type FlagMessageMessagesMessagesMessageIdFlagPostApiResponse = /** status 200 Successful Response */ MessageRead;
export type FlagMessageMessagesMessagesMessageIdFlagPostApiArg = {
  messageId: number;
  /** Flag reason */
  reason: string;
};
export type CreatePaymentOrderPaymentsPaymentsCreateOrderPostApiResponse =
  /** status 200 Successful Response */ PayPalOrderResponse;
export type CreatePaymentOrderPaymentsPaymentsCreateOrderPostApiArg = {
  paymentCreate: PaymentCreate;
};
export type CapturePaymentPaymentsPaymentsCapturePaymentIdPostApiResponse =
  /** status 200 Successful Response */ PaymentCaptureResponse;
export type CapturePaymentPaymentsPaymentsCapturePaymentIdPostApiArg = {
  paymentId: number;
};
export type GetPaymentPaymentsPaymentsPaymentIdGetApiResponse = /** status 200 Successful Response */ PaymentRead;
export type GetPaymentPaymentsPaymentsPaymentIdGetApiArg = {
  paymentId: number;
};
export type GetUserPaymentsPaymentsPaymentsUserPaymentsGetApiResponse =
  /** status 200 Successful Response */ PaymentRead[];
export type GetUserPaymentsPaymentsPaymentsUserPaymentsGetApiArg = void;
export type PaypalWebhookPaymentsPaymentsWebhookPaypalPostApiResponse =
  /** status 200 Successful Response */ WebhookResponse;
export type PaypalWebhookPaymentsPaymentsWebhookPaypalPostApiArg = void;
export type GetOnlineUsersWsOnlineUsersGetApiResponse = /** status 200 Successful Response */ OnlineUsersResponse;
export type GetOnlineUsersWsOnlineUsersGetApiArg = void;
export type GetUserStatusWsUserStatusUserIdGetApiResponse = /** status 200 Successful Response */ UserStatusResponse;
export type GetUserStatusWsUserStatusUserIdGetApiArg = {
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
export type ProjectRead = {
  title: string;
  description?: string | null;
  url?: string | null;
  cover_image?: string | null;
  earned: number;
  time_taken?: string | null;
  id: number;
  freelancer_id: number;
  created_at: string;
  updated_at: string;
};
export type FreelancerRead = {
  title: string;
  bio?: string | null;
  hourly_rate: number;
  years_of_experience: number;
  skills: string[];
  technologies: string[];
  portfolio_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  is_available: boolean;
  country: string;
  id: number;
  user_id: number;
  projects: ProjectRead[];
  created_at: string;
  updated_at: string;
};
export type FilterOptionsResponse = {
  skills: string[];
  technologies: string[];
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
export type UserType = "client_hunter" | "freelancer";
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
  useRegisterUserAuthAuthRegisterPostMutation,
  useLoginUserAuthAuthLoginPostMutation,
  useGetCurrentUserProfileAuthAuthMeGetQuery,
  useUpdateCurrentUserProfileAuthAuthMePutMutation,
  useRefreshAccessTokenAuthAuthRefreshPostMutation,
  useGetCurrentUserInfoUsersMeGetQuery,
  useUpdateCurrentUserUsersMePutMutation,
  useGetUserUsersUserIdGetQuery,
  useGetFreelancerProfileUsersUserIdFreelancerProfileGetQuery,
  useListUsersUsersGetQuery,
  useGetFilterOptionsUsersFiltersOptionsGetQuery,
  useGetUserStatsUsersStatsSummaryGetQuery,
  useCreateChatChatsChatsPostMutation,
  useListUserChatsChatsChatsGetQuery,
  useGetChatChatsChatsChatIdGetQuery,
  useUpdateChatChatsChatsChatIdPutMutation,
  useDeleteChatChatsChatsChatIdDeleteMutation,
  useArchiveChatChatsChatsChatIdArchivePostMutation,
  useUnarchiveChatChatsChatsChatIdUnarchivePostMutation,
  useGetChatStatsChatsChatsStatsSummaryGetQuery,
  useSendMessageMessagesMessagesPostMutation,
  useGetChatMessagesMessagesMessagesChatChatIdGetQuery,
  useGetMessageMessagesMessagesMessageIdGetQuery,
  useEditMessageMessagesMessagesMessageIdPutMutation,
  useDeleteMessageMessagesMessagesMessageIdDeleteMutation,
  useSearchMessagesMessagesMessagesSearchGetQuery,
  useFlagMessageMessagesMessagesMessageIdFlagPostMutation,
  useCreatePaymentOrderPaymentsPaymentsCreateOrderPostMutation,
  useCapturePaymentPaymentsPaymentsCapturePaymentIdPostMutation,
  useGetPaymentPaymentsPaymentsPaymentIdGetQuery,
  useGetUserPaymentsPaymentsPaymentsUserPaymentsGetQuery,
  usePaypalWebhookPaymentsPaymentsWebhookPaypalPostMutation,
  useGetOnlineUsersWsOnlineUsersGetQuery,
  useGetUserStatusWsUserStatusUserIdGetQuery,
} = injectedRtkApi;
