import React, { useState, useEffect, useRef } from 'react';
import { Home, CloudRain, Car, Users, Flame, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Youtube, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MusicPreloader from '../components/music/MusicPreloader';

const MusicMood = () => {
  const navigate = useNavigate();
  const [currentScenery, setCurrentScenery] = useState(0);
  const [currentMusic, setCurrentMusic] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPreloader, setShowPreloader] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Ambient Sound States
  const [ambience, setAmbience] = useState({
    rain: false,
    traffic: false,
    people: false,
    fire: false
  });

  const audioRef = useRef(null); // Main Music
  const rainRef = useRef(null);
  const trafficRef = useRef(null);
  const peopleRef = useRef(null);
  const fireRef = useRef(null);

  // Initialize Ambient Sounds once
  useEffect(() => {
    rainRef.current = new Audio('/sounds/rain.mp3');
    trafficRef.current = new Audio('/sounds/traffic.mp3');
    peopleRef.current = new Audio('/sounds/people.mp3');
    fireRef.current = new Audio('/sounds/campfire.mp3');

    [rainRef, trafficRef, peopleRef, fireRef].forEach(ref => {
      ref.current.loop = true;
      ref.current.volume = 0.4; // Default background volume
      ref.current.preload = 'auto';
    });

    return () => {
      // Cleanup: Pause and clear audio to prevent memory leaks or playing after unmount
      [rainRef, trafficRef, peopleRef, fireRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = "";
          ref.current = null;
        }
      });
    };
  }, []);

  // Handle Ambience Toggle
  useEffect(() => {
    const toggleSound = (audio, shouldPlay) => {
      if (!audio) return;
      if (shouldPlay) {
        // Only play if not already playing to avoid promise interruption
        if (audio.paused) {
          audio.play().catch(e => console.warn("Audio play failed:", e));
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    };

    toggleSound(rainRef.current, ambience.rain);
    toggleSound(trafficRef.current, ambience.traffic);
    toggleSound(peopleRef.current, ambience.people);
    toggleSound(fireRef.current, ambience.fire);
  }, [ambience]);

  // Sync Volume
  useEffect(() => {
    const vol = isMuted ? 0 : volume;
    if (audioRef.current) audioRef.current.volume = vol;

    // Scale ambient sounds relative to main volume but slightly lower
    const ambientVol = Math.max(0, vol * 0.6);

    if (rainRef.current) rainRef.current.volume = ambientVol;
    if (trafficRef.current) trafficRef.current.volume = ambientVol;
    if (peopleRef.current) peopleRef.current.volume = ambientVol;
    if (fireRef.current) fireRef.current.volume = ambientVol;
  }, [volume, isMuted]);


  // Scenery data
  const sceneries = [
    {
      id: 1,
      name: 'Lo-Fi Coffee Shop',
      image: '/images/lofi-cafe.gif',
      mood: 'Relaxed & Focused',
      color: 'from-blue-900 to-purple-900'
    },
    {
      id: 2,
      name: 'Rainy Night',
      image: '/images/rainy-night.gif',
      mood: 'Calm & Peaceful',
      color: 'from-gray-800 to-blue-900'
    },
    {
      id: 3,
      name: 'Forest Path',
      image: '/images/forest.gif',
      mood: 'Natural & Fresh',
      color: 'from-green-800 to-teal-900'
    },
    {
      id: 4,
      name: 'Beach Sunset',
      image: '/images/beach.jpg',
      mood: 'Warm & Serene',
      color: 'from-orange-800 to-pink-900'
    },
    {
      id: 5,
      name: 'Mountain View',
      image: '/images/mountain.jpg',
      mood: 'Inspiring & Calm',
      color: 'from-indigo-900 to-purple-900'
    }
  ];

  // Music tracks (Main Playlist)
  const musicTracks = [
    { id: 1, title: 'Chill Vibes 1', src: '/sounds/music1.mp3' },
    { id: 2, title: 'Chill Vibes 2', src: '/sounds/music2.mp3' },
    { id: 3, title: 'Study Session', src: '/sounds/music5.mp3' },
    { id: 4, title: 'Peaceful Mind', src: '/sounds/music10.mp3' },
    { id: 5, title: 'Sunset Dreams', src: '/sounds/music15.mp3' },
    { id: 6, title: 'Night Vibes', src: '/sounds/music20.mp3' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      handleNextMusic();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentMusic]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = musicTracks[currentMusic].src;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentMusic]);

  useEffect(() => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.play() : audioRef.current.pause();
    }
  }, [isPlaying]);

  const handlePrevScenery = () => {
    setCurrentScenery((prev) => (prev === 0 ? sceneries.length - 1 : prev - 1));
  };

  const handleNextScenery = () => {
    setCurrentScenery((prev) => (prev === sceneries.length - 1 ? 0 : prev + 1));
  };

  const handlePrevMusic = () => {
    setCurrentMusic((prev) => (prev === 0 ? musicTracks.length - 1 : prev - 1));
  };

  const handleNextMusic = () => {
    setCurrentMusic((prev) => (prev === musicTracks.length - 1 ? 0 : prev + 1));
  };

  const toggleAmbience = (type) => {
    setAmbience(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-white/20">
      {showPreloader && <MusicPreloader />}
      <audio ref={audioRef} preload="metadata" />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 z-40 p-3 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition-all border border-white/10"
      >
        <Home className="w-5 h-5 opacity-80 hover:opacity-100" />
      </motion.button>

      {/* Background Scenery */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScenery}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className={`absolute inset-0 bg-linear-to-b ${sceneries[currentScenery].color} opacity-30 z-10`} />
          <div className="absolute inset-0 bg-black/20 z-10" />
          <img
            src={sceneries[currentScenery].image}
            alt={sceneries[currentScenery].name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Scenery Navigation Arrows */}
      <button
        onClick={handlePrevScenery}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full hover:bg-white/10 transition-all group"
      >
        <ChevronLeft className="w-10 h-10 text-white/50 group-hover:text-white transition-colors" />
      </button>

      <button
        onClick={handleNextScenery}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full hover:bg-white/10 transition-all group"
      >
        <ChevronRight className="w-10 h-10 text-white/50 group-hover:text-white transition-colors" />
      </button>

      {/* Main Content Area */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-12 sm:pb-16 items-center pointer-events-none">

        {/* Minimal Controller */}
        <div className="pointer-events-auto w-[90%] max-w-lg bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group hover:bg-black/50 transition-colors">

          {/* Ambient Toggles Row */}
          <div className="flex justify-center gap-6 mb-4">
            <button onClick={() => toggleAmbience('rain')}
              className={`p-2 rounded-full transition-all ${ambience.rain ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`} title="Rain">
              <CloudRain className="w-5 h-5" />
            </button>
            <button onClick={() => toggleAmbience('traffic')}
              className={`p-2 rounded-full transition-all ${ambience.traffic ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`} title="City Traffic">
              <Car className="w-5 h-5" />
            </button>
            <button onClick={() => toggleAmbience('people')}
              className={`p-2 rounded-full transition-all ${ambience.people ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`} title="Crowd">
              <Users className="w-5 h-5" />
            </button>
            <button onClick={() => toggleAmbience('fire')}
              className={`p-2 rounded-full transition-all ${ambience.fire ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`} title="Campfire">
              <Flame className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar (Minimal) */}
          <div className="flex items-center gap-3 px-1 mb-4 group/progress">
            <span className="text-[10px] text-white/40 w-8 text-right font-mono">{formatTime(currentTime)}</span>
            <div className="flex-1 relative h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer">
              <input
                type="range"
                min="0"
                max="100"
                value={(currentTime / duration) * 100 || 0}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="h-full bg-red-600 rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg border-2 border-white" />
              </div>
            </div>
            <span className="text-[10px] text-white/40 w-8 font-mono">{formatTime(duration)}</span>
          </div>

          {/* Main Controls (Compact) */}
          <div className="flex items-center justify-between px-2 sm:px-4">

            {/* Volume */}
            <div className="relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-white/60 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 80 }}
                    exit={{ opacity: 0, width: 0 }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/60 rounded-full h-6 flex items-center px-2 overflow-hidden"
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume * 100}
                      onChange={(e) => setVolume(e.target.value / 100)}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Playback */}
            <div className="flex items-center gap-4">
              <button onClick={handlePrevMusic} className="p-2 text-white/60 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>

              <button onClick={handleNextMusic} className="p-2 text-white/60 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Extras */}
            <div className="flex gap-2">
              <button onClick={handleFullscreen} className="p-2 text-white/60 hover:text-white transition-colors">
                <Maximize className="w-4 h-4" />
              </button>
              <button className="p-2 text-white/60 hover:text-red-500 transition-colors">
                <Youtube className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicMood;
