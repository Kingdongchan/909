import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import penguinImg from "figma:asset/29c23eced92f6b780707b116ea7fa6753db5b39b.png";
import { ThumbsUp, MessageCircle, Search, TrendingUp } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  likes: number;
  comments: number;
  time: string;
  thumbnail?: string;
}

const mockPosts: Post[] = [
  {
    id: "1",
    title: "펜슨 크스: 연실무 덮밥스 키친",
    content: "오모역 근처가 참말 맛실타입니다. 대전에서 벗 출발하더래요. KTX 기차 타고 집까지 3시간 걸릴 예정인데 헤헤",
    author: "대전자",
    category: "여행지",
    likes: 234,
    comments: 365,
    time: "5분전",
    thumbnail: "https://via.placeholder.com/150x100?text=Camp",
  },
  {
    id: "2",
    title: "소재동 카페거리에서의 여유로운 휴식",
    content: "대전에서 유명한 카페거리에서 친구들과 즐거운 시간을 보냈어요. 특히 속초 커피가 너무 맛있었어요!",
    author: "소재동",
    category: "카페",
    likes: 187,
    comments: 600,
    time: "600m 가면",
  },
  {
    id: "3",
    title: "중앙시장 최고의 길거리 음식",
    content: "다양한 보츠와 양미디 먹었어. 길거리 대전의 다양한 느낌을 느낄 수 있는 곳들 적극 추천!",
    author: "푸드왕",
    category: "맛집",
    likes: 156,
    comments: 490,
    time: "490m 가면",
  },
];

const popularPlaces = [
  { rank: 1, name: "판암수족관", posts: "오늘 1,267 건" },
  { rank: 2, name: "스마더프로 쇼핑", posts: "오늘 982건씩" },
  { rank: 3, name: "류성준탑", posts: "오늘 620건험장" },
];

export default function CommunityPage() {
  const { placeName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const displayPlaceName = placeName ? decodeURIComponent(placeName) : "역주변추천명소";
  const tabs = ["전체", "추천순", "최신", "리뷰", "사진"];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/map")}
                className="w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center overflow-hidden"
              >
                <img src={penguinImg} alt="Logo" className="w-full h-full object-cover" />
              </button>
              <h1 className="text-xl">{displayPlaceName}</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 text-white rounded-lg transition-colors">
                게시글 작성
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1">
            {/* Search and category */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="대전의 편의 위치 추천해 슈퍼미 모두같은 명소를 찾고싶어요"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-3 border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 transition-colors ${
                      activeTab === tab
                        ? "text-cyan-500 border-b-2 border-cyan-500"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <button className="ml-auto text-red-500 text-sm">
                  + 10개의 관련 대퍼터
                </button>
              </div>
            </div>

            {/* Posts list */}
            <div className="space-y-4">
              {mockPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex gap-4">
                    {post.thumbnail && (
                      <div className="w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg mb-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{post.author}</span>
                        <span>•</span>
                        <span>{post.time}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-cyan-500" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                          {post.comments}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-80 space-y-6">
            {/* Popular places */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3>내 주변 인기 장소</h3>
              </div>
              <div className="space-y-3">
                {popularPlaces.map((place) => (
                  <div
                    key={place.rank}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="text-orange-500">{String(place.rank).padStart(2, "0")}</div>
                    <div className="flex-1">
                      <h4 className="text-sm mb-1">{place.name}</h4>
                      <p className="text-xs text-gray-500">{place.posts}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Penguin helper */}
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  <img src={penguinImg} alt="Helper" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">대연에게 물어!</h4>
                  <p className="text-sm opacity-90">
                    모든 대전여행 정보를 펭귄이 도와줄 것이 아닌가도 모르겠어요!
                  </p>
                </div>
              </div>
            </div>

            {/* Today's event */}
            <div className="bg-gray-900 rounded-xl shadow-sm p-6 text-white">
              <h3 className="mb-4">오늘의 이벤트</h3>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <input
                  type="text"
                  placeholder="지금 다른로투돔"
                  className="w-full bg-transparent border-none text-white placeholder-white/60 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
