API Documentation

| Table | Query | Mutation | Properties |
|--------|--------|----------|--------|
| User | | | id email firebase_uid first_name last_name username dob gender profile_picture role status timezone searchable fcm_token created_at updated_at last_login_at |
| Friendship | getFriendships(id)<br>getFriendRequests(id) | createFriendship()<br>updateFriendship()<br>deleteFriendship() | sender {id first_name last_name } receiver {id first_name last_name } status  |
| Community | getAllCommunities()<br>getCommunity(community_id) | createCommunity()<br>updateCommunity()<br>deleteCommunity() | id name description thumbnail influencer { id first_name last_name email } created_at updated_at |
| CommunityCategory | getCommunityCategories(id)<br>getCategoryCommunities(id) | createCommunityCategory()<br>deleteCommunityCategory() | community { id name influencer { id first_name last_name } } category |
| CommunityMember | getCommunityMembers(community_id)<br>getUserCommunities(user_id) | createCommunityMember()<br>updateCommunityMember()<br>deleteCommunityMember() | community { id name influencer { id first_name last_name } } user { id first_name last_name } role status joined_at |
| Chat | getAllChats(id) | createChat()<br>updateChat()<br>deleteChat() | id type title password profile_pic creator { id first_name last_name email } created_at updated_at |
| ChatMember | getChatMembers(id)<br>getUserChats(id) | createChatMember()<br>updateChatMember()<br>deleteChatMember() | chat { id type title creator { id first_name last_name email } } user { id first_name last_name email } role status joined_at |
| Message | getMessages(chat_id) | createMessage() | id chat { id type title } sender { id first_name last_name } content post { id caption } created_at  |
| Point | getPoint(user_id) | updatePoint() | user { id first_name last_name } points spending_points weekly_points monthly_points |
| Reward | getRewards() | createReward()<br>updateReward()<br>deleteReward() | id title description required_points |
| Redeem | getRedeems(user_id) | createRedeem()<br>updateRedeem()<br>deleteRedeem() | id user { id first_name last_name } reward { id title required_points } points_spent status |

| Mutation Inputs | Create | Update | Delete |
|--------|--------|----------|--------|
| General Template | mutation($params: type!){ createObject(params: $params) { success object { objectProperties } errors { field message } } } | mutation($params: type!){ updateObject(params: $params ) { success object { objectProperties } errors { field message } } } | mutation($params: type!){ deleteObject(params: $params) { success errors { field message } } } |
| Friendship |  |  |  |
| Community |  |  |  |
| CommunityCategory |  |  |  |
| CommunityMember |  |  |  |
| Chat |  |  |  |
| ChatMember |  |  |  |
| Message |  |  |  |
| Point |  |  |  |
| Reward |  |  |  |
| Redeem |  |  |  |