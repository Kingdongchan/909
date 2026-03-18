import { useState } from "react";
import { useNavigate } from "react-router";
import penguinImg from "figma:asset/29c23eced92f6b780707b116ea7fa6753db5b39b.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      navigate("/map");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-400 to-blue-500 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-32 w-48 h-48 bg-white rounded-full blur-xl"></div>
      </div>

      {/* Penguin character */}
      <div className="absolute left-12 md:left-32 top-1/2 -translate-y-1/2">
        <div className="relative">
          <img src={penguinImg} alt="Penguin" className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-lg whitespace-nowrap">
            <p className="text-sm">반갑다 여행러 ㅋ</p>
            <p className="text-xs text-gray-500">오늘은 어디로 갈거야?</p>
          </div>
        </div>
      </div>

      {/* Login card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md mx-4 ml-auto mr-8 md:mr-32">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">Daejeon</h1>
          <p className="text-gray-500">Arctic Project</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="아이디를 입력"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-cyan-50/50 border-none rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-cyan-50/50 border-none rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-cyan-400 hover:bg-cyan-500 text-white py-3 rounded-xl transition-colors shadow-lg"
          >
            로그인 →
          </button>
        </form>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-500 mb-4">CONTINUE WITH</p>
          <div className="flex justify-center gap-4">
            <button className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow">
              N
            </button>
            <button className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-white hover:bg-yellow-500 transition-colors shadow">
              K
            </button>
            <button className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors shadow">
              G
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
            회원가입 (Sign Up)
          </a>
        </div>

        <div className="absolute -bottom-12 right-8 bg-white px-4 py-2 rounded-xl shadow-lg">
          <p className="text-xs text-gray-600">Welcome to Daejeon Arctic!</p>
        </div>
      </div>
    </div>
  );
}
