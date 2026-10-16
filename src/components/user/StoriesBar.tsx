import React, { useRef, useState, useEffect } from 'react';
import { Plus, Video, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, StoryTestimonial, UserProfile } from '../../types';
import { t } from '../../translations';

interface StoriesBarProps {
  stories?: StoryTestimonial[];
  currentUser?: UserProfile;
  language?: Language;
  onOpenStory: (story: StoryTestimonial, index?: number) => void;
  onOpenCreateStory?: () => void;
  onAddStory?: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories = [],
  currentUser,
  language = 'fr',
  onOpenStory,
  onOpenCreateStory,
  onAddStory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [stories]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 320);
    }
  };

  const handleAdd = () => {
    if (onAddStory) onAddStory();
    else if (onOpenCreateStory) onOpenCreateStory();
  };

  const userAvatar =
    currentUser?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';

  const strings = t[language]?.story || t.fr.story;

  return (
    <div className="relative group/bar w-full bg-[#111827]/90 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-slate-800/80 shadow-lg">
      
      {/* Left Scroll Navigation Button */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          aria-label={language === 'sw' ? 'Sogeza kushoto' : language === 'en' ? 'Scroll left' : 'Faire défiler vers la gauche'}
          title={language === 'sw' ? 'Iliyopita' : language === 'en' ? 'Previous' : 'Précédent'}
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border border-cyan-500/40 shadow-xl shadow-slate-950/60 items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Right Scroll Navigation Button */}
      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          aria-label={language === 'sw' ? 'Sogeza kulia' : language === 'en' ? 'Scroll right' : 'Faire défiler vers la droite'}
          title={language === 'sw' ? 'Inayofuata' : language === 'en' ? 'Next' : 'Suivant'}
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border border-cyan-500/40 shadow-xl shadow-slate-950/60 items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Stories Scrollable Area (scrollbar hidden on stories bar) */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto scroll-smooth py-0.5 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 1. "Mon Histoire" */}
        <div
          onClick={handleAdd}
          className="flex flex-col items-center gap-1.5 cursor-pointer group select-none shrink-0"
        >
          <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-slate-900 border-2 border-cyan-500/80 p-0.5 shadow-md group-hover:scale-105 transition-all">
            <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-800">
              <img
                src={userAvatar}
                alt={strings.myStory}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
              />
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-cyan-400 group-hover:text-cyan-300">
            {strings.myStory}
          </span>
        </div>

        {/* 2. Member Stories */}
        {(stories || []).map((story, index) => {
          return (
            <div
              key={story.id}
              onClick={() => onOpenStory(story, index)}
              className="flex flex-col items-center gap-1 cursor-pointer group select-none max-w-[76px] shrink-0"
            >
              {/* Avatar with gradient ring */}
              <div
                className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-full p-[2px] transition-all group-hover:scale-105 ${
                  story.hasRingGlow
                    ? 'bg-gradient-to-tr from-cyan-400 via-teal-400 to-emerald-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-700/60'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-[#111827]">
                  <img
                    src={story.authorAvatar}
                    alt={story.authorName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Media badge */}
                {story.type === 'video' && (
                  <div className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center">
                    <Video className="w-2.5 h-2.5" />
                  </div>
                )}
                {story.type === 'audio' && (
                  <div className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-slate-900 border border-slate-700 text-teal-400 flex items-center justify-center">
                    <Volume2 className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              {/* Author name */}
              <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate w-full text-center">
                {story.authorName}
              </span>

              {/* Community short subtitle */}
              <span className="text-[9px] text-cyan-400/90 font-semibold truncate w-full text-center -mt-0.5">
                {story.communityName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
