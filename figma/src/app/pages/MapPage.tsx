import { useState } from "react";
import { useNavigate } from "react-router";
import penguinImg from "figma:asset/29c23eced92f6b780707b116ea7fa6753db5b39b.png";
import { MapPin, Navigation, Home } from "lucide-react";

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
}

const mockPlaces: Place[] = [
  { id: "1", name: "Starfield Library", lat: 37.5097, lng: 127.0561, category: "도서관" },
  { id: "2", name: "대전 고", lat: 36.3504, lng: 127.3845, category: "교육" },
  { id: "3", name: "평양수육", lat: 37.5665, lng: 126.9780, category: "맛집" },
  { id: "4", name: "소재동 카페거리", lat: 36.3421, lng: 127.3991, category: "카페" },
  { id: "5", name: "밤양시장", lat: 36.3276, lng: 127.4267, category: "시장" },
];

export default function MapPage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("전체");

  const categories = ["전체", "여행지", "맛집", "도서관", "카페", "자연/공원"];

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place);
  };

  const goToCommunity = (placeName: string) => {
    navigate(`/community/${encodeURIComponent(placeName)}`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* Left sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* User profile */}
        <div className="p-6 bg-cyan-50 flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center overflow-hidden">
            <img src={penguinImg} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3>대전 고 (Daejeon Go)</h3>
            <p className="text-sm text-gray-500">대전 여행자</p>
          </div>
        </div>

        {/* Route input */}
        <div className="p-6 border-b">
          <div className="bg-gray-50 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-cyan-500" />
              <span className="text-sm text-gray-600">300m 앞 우회전</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <input
                type="text"
                placeholder="출발지"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <input
                type="text"
                placeholder="도착지"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <button className="w-full bg-cyan-400 hover:bg-cyan-500 text-white py-2 rounded-lg transition-colors">
              경로 검색 하기 →
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 border-b">
          <h3 className="text-sm mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            장소 분류
          </h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeCategory === cat
                    ? "bg-cyan-400 text-white"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  {cat === "전체" && "📍"}
                  {cat === "여행지" && "🏠"}
                  {cat === "맛집" && "🍽️"}
                  {cat === "도서관" && "📚"}
                  {cat === "카페" && "☕"}
                  {cat === "자연/공원" && "🌲"}
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-auto p-6 bg-cyan-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center overflow-hidden">
              <img src={penguinImg} alt="Mascot" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm mb-1">월별 22°C 평일!</p>
              <p className="text-xs text-gray-500">
                오늘 평일 날씨가 멋져요!
                <br />
                대전으로 탐험하러 갈까요? 👍
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {/* Mock map background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50">
          {/* Simulated map lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <line x1="0" y1="200" x2="100%" y2="300" stroke="#60a5fa" strokeWidth="3" />
            <line x1="200" y1="0" x2="400" y2="100%" stroke="#3b82f6" strokeWidth="2" />
            <line x1="50%" y1="0" x2="80%" y2="100%" stroke="#60a5fa" strokeWidth="2" />
          </svg>

          {/* Place pins on map */}
          {mockPlaces.map((place, index) => (
            <button
              key={place.id}
              onClick={() => handlePlaceClick(place)}
              className="absolute group"
              style={{
                left: `${30 + index * 15}%`,
                top: `${20 + index * 12}%`,
              }}
            >
              <div className="relative">
                <MapPin className="w-8 h-8 text-blue-500 drop-shadow-lg hover:text-blue-700 transition-colors" fill="currentColor" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
                  {place.name}
                </div>
              </div>
            </button>
          ))}

          {/* Route visualization */}
          {origin && destination && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 200 300 Q 400 200 600 400"
                stroke="#3b82f6"
                strokeWidth="4"
                fill="none"
                strokeDasharray="10,5"
              />
            </svg>
          )}
        </div>

        {/* Place popup */}
        {selectedPlace && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 z-10">
            <div className="mb-4">
              <div className="w-full h-48 bg-gray-200 rounded-xl mb-4 overflow-hidden">
                <img
                  src={`https://via.placeholder.com/400x200?text=${encodeURIComponent(selectedPlace.name)}`}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl mb-2">{selectedPlace.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                A futuristic public library located in the center of COEX Mall. Features towering book shelves and a cozy atmosphere.
              </p>
              <div className="flex items-center gap-2 text-yellow-500 mb-4">
                <span>🔥</span>
                <span className="text-sm">4.8</span>
              </div>
            </div>
            <button
              onClick={() => goToCommunity(selectedPlace.name)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              커뮤니티로 이동
              <span className="text-xl">🔥</span>
            </button>
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Penguin helper */}
        <div className="absolute bottom-8 right-8">
          <div className="relative">
            <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
              <img src={penguinImg} alt="Helper" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-16 right-0 bg-white px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
              <p className="text-sm">월별 22°C 평일!</p>
              <p className="text-xs text-gray-500">오늘 평일 날씨가 좋아요! 👍</p>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs animate-pulse">
              🔥
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
