import React from 'react';
import { motion } from 'framer-motion';
import { TreePine, Leaf, Flower2, Heart, Users, MapPin, Calendar, ArrowRight } from 'lucide-react';

const App = () => {
  return (
    <div className="min-h-screen bg-[#f8faf7] text-[#2d3a2d] selection:bg-[#c1d9b7] selection:text-[#1a241a]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-[#e2ece0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-[#4a6b4a]">
            <TreePine className="w-6 h-6" />
            <span>Little Forest</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5a7a5a]">
            <a href="#about" className="hover:text-[#2d3a2d] transition-colors">소개</a>
            <a href="#features" className="hover:text-[#2d3a2d] transition-colors">기능</a>
            <a href="#community" className="hover:text-[#2d3a2d] transition-colors">커뮤니티</a>
            <button className="bg-[#4a6b4a] text-white px-5 py-2 rounded-full hover:bg-[#3d5a3d] transition-colors shadow-sm">
              시작하기
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f2e6] text-[#4a6b4a] text-xs font-semibold mb-6"
          >
            <Leaf className="w-3 h-3" />
            <span>우리들만의 작은 숲</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]"
          >
            일상의 소란함을 뒤로하고,<br />
            <span className="text-[#4a6b4a] italic font-serif">쉼</span>을 찾아보세요.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[#6a8a6a] max-w-2xl mb-12 leading-relaxed"
          >
            10명의 소중한 인연들이 함께 가꾸어가는 작은 정원입니다.<br />
            매일의 감사와 생각을 나누며 서로의 성장을 응원합니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center"
          >
            <button className="px-8 py-4 bg-[#4a6b4a] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#3d5a3d] transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-[#4a6b4a]/20">
              오늘의 숲 입장하기 <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white border border-[#e2ece0] text-[#5a7a5a] rounded-2xl font-bold hover:bg-[#f3f7f2] transition-all shadow-sm">
              둘러보기
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Heart className="w-8 h-8 text-[#e3a6a1]" />,
                title: "감사 일기",
                desc: "오늘 있었던 작은 감사한 일들을 기록하고 공유합니다."
              },
              {
                icon: <Users className="w-8 h-8 text-[#7ba5d9]" />,
                title: "따뜻한 연결",
                desc: "10명의 멤버들이 자유롭게 소통하고 서로를 격려합니다."
              },
              {
                icon: <Flower2 className="w-8 h-8 text-[#d9c57b]" />,
                title: "성장 기록",
                desc: "매일 조금씩 자라나는 우리들의 이야기를 담아둡니다."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-[#f8faf7] border border-[#e2ece0] hover:shadow-xl hover:shadow-[#4a6b4a]/5 transition-all group"
              >
                <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#6a8a6a] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gratitude Section */}
      <section id="community" className="py-24 px-6 bg-gradient-to-b from-white to-[#f8faf7]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">오늘의 감사 기록</h2>
            <p className="text-[#6a8a6a]">우리들의 작은 숲에는 매일 따뜻한 감사들이 쌓여갑니다.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "지우", content: "오늘 아침 숲속 공기가 너무 맑아서 행복했어요. 🌱", date: "2시간 전" },
              { name: "민우", content: "따뜻한 차 한 잔과 함께하는 여유, 감사한 하루입니다.", date: "5시간 전" },
              { name: "소연", content: "새로 심은 꽃이 드디어 꽃망울을 터뜨렸네요! 🌸", date: "어제" }
            ].map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-[#e2ece0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#f0f4ef] flex items-center justify-center font-bold text-[#4a6b4a]">
                    {post.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{post.name}</div>
                    <div className="text-[10px] text-[#9aada0]">{post.date}</div>
                  </div>
                </div>
                <p className="text-[#5a7a5a] text-sm leading-relaxed mb-4">
                  "{post.content}"
                </p>
                <div className="flex items-center gap-4 text-[#9aada0]">
                  <button className="flex items-center gap-1 hover:text-[#4a6b4a] transition-colors">
                    <Heart className="w-4 h-4" /> <span className="text-xs">12</span>
                  </button>
                </div>
              </motion.div>
            ))}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#e2ece0] rounded-3xl p-6 text-[#9aada0] hover:border-[#4a6b4a] hover:text-[#4a6b4a] transition-all bg-white/50"
            >
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <span className="font-medium">나의 기록 남기기</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#4a6b4a] rounded-[2.5rem] p-10 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">함께하는 공간</h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                리틀포레스트는 누구에게나 열려있지만,<br />
                우리들만의 깊은 이야기를 위해 소규모로 운영됩니다.
              </p>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4" /> 숲속 아지트
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Calendar className="w-4 h-4" /> 매일 09:00 - 22:00
                </div>
              </div>
            </div>
            <TreePine className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
          </div>
          
          <div className="bg-[#e8ece7] rounded-[2.5rem] p-10 flex flex-col justify-center border border-[#d9e2d8]">
            <h2 className="text-3xl font-bold mb-6">"작은 것이 모여<br />숲을 이룹니다."</h2>
            <p className="text-[#5a7a5a] text-lg italic font-serif">
              - Little Forest Crew
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#e2ece0] text-center text-[#9aada0] text-sm">
        <p>© 2026 Little Forest App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
