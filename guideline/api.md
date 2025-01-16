API Documentation

| Domain | Query | Mutation | Notes |
|--------|--------|----------|--------|
| Friendship | GET /friends/requests<br>GET /friends | createFriendship()<br>updateFriendship()<br>deleteFriendship() |  |
| Community | getAllCommunities()<br>getCommunity(community_id) | createCommunity()<br>updateCommunity()<br>deleteCommunity() | Basic community operations |
| CommunityCategory | - | createCommunityCategory()<br>deleteCommunityCategory() | Category management |
| CommunityMember | getCommunityMembers(community_id)<br>getUserCommunities(user_id) | createCommunityMember()<br>updateCommunityMember()<br>deleteCommunityMember() | Member management |
| Chat | query | createChat()<br>updateChat()<br>deleteChat() | Member management |
| ChatMember | query | createChatMember()<br>updateChatMember()<br>deleteChatMember() | Member management |
| Message | getMessages(chat_id) | createMessage() | Chat messaging operations |
| Point | getPoint(user_id) | updatePoint() | - Auto-created for new users<br>- Auto-deleted with user (cascade) |
| Reward | getRewards() | createReward()<br>updateReward()<br>deleteReward() | Developer-only operations |
| Redeem | getRedeems(user_id) | createRedeem()<br>updateRedeem()<br>deleteRedeem() |  |