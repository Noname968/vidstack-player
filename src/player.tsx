import "@vidstack/react/player/styles/base.css";

import { useEffect, useRef, useState } from "react";

import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  TextTrack,
  useMediaStore,
  type MediaCanPlayDetail,
  type MediaCanPlayEvent,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent,
} from "@vidstack/react";

import { VideoLayout } from "./components/layouts/video-layout";
import { textTracks } from "./tracks";

export function Player() {
  let player = useRef<MediaPlayerInstance>(null);
  const { duration } = useMediaStore(player);

  const data = {
    "headers": {
      "Referer": "https://embtaku.pro/embedplus?id=MjEyNjEw&token=ZLiWX1rA0uKEj-pAqSH_dg&expires=1708449818"
    },
    "sources": [
      {
        "url": "https://www041.vipanicdn.net/streamhls/7f8dd00fcdec4483b9ff13f47a3ec4e2/ep.1.1696001423.360.m3u8",
        "isM3U8": true,
        "quality": "360p"
      },
      {
        "url": "https://www041.vipanicdn.net/streamhls/7f8dd00fcdec4483b9ff13f47a3ec4e2/ep.1.1696001423.480.m3u8",
        "isM3U8": true,
        "quality": "480p"
      },
      {
        "url": "https://www041.vipanicdn.net/streamhls/7f8dd00fcdec4483b9ff13f47a3ec4e2/ep.1.1696001423.720.m3u8",
        "isM3U8": true,
        "quality": "720p"
      },
      {
        "url": "https://www041.vipanicdn.net/streamhls/7f8dd00fcdec4483b9ff13f47a3ec4e2/ep.1.1696001423.1080.m3u8",
        "isM3U8": true,
        "quality": "1080p"
      },
      {
        "url": "https://www041.vipanicdn.net/streamhls/7f8dd00fcdec4483b9ff13f47a3ec4e2/ep.1.1696001423.m3u8",
        "isM3U8": true,
        "quality": "default"
      },
      {
        "url": "https://www041.anifastcdn.info/videos/hls/egtCndH70pDKYIkhO76LOg/1708457019/212610/7f8dd00fcdec4483b9ff13f47a3ec4e2/ep.1.1696001423.m3u8",
        "isM3U8": true,
        "quality": "backup"
      }
    ],
    "download": "https://gogohd.net/download?id=MjEyNjEw&token=ZLiWX1rA0uKEj-pAqSH_dg&expires=1708449818"
  }

  const skipData = {
    "found": true,
    "results": [
      {
        "interval": {
          "startTime": 1460.304,
          "endTime": 1550.304
        },
        "skipType": "ed",
        "skipId": "51c396fc-1bca-4f11-a99d-76510bf725b9",
        "episodeLength": 1560.1488
      },
      {
        "interval": {
          "startTime": 3.221,
          "endTime": 93.221
        },
        "skipType": "op",
        "skipId": "c2cacbe5-4247-4ed7-bb64-28e780daf975",
        "episodeLength": 1559.949
      }
    ],
    "message": "Successfully found skip times",
    "statusCode": 200
  }

  const op = skipData?.results?.find((item) => item.skipType === 'op') || null;
  const ed = skipData?.results?.find((item) => item.skipType === 'ed') || null;
  const episodeLength = skipData?.results?.find((item) => item.episodeLength)?.episodeLength || 0;

  const skiptime: { text: string; }[] = [];

  if (op?.interval) {
    skiptime.push({
      startTime: op.interval.startTime ?? 0,
      endTime: op.interval.endTime ?? 0,
      text: 'Opening',
    });
  }
  if (ed?.interval) {
    skiptime.push({
      startTime: ed.interval.startTime ?? 0,
      endTime: ed.interval.endTime ?? 0,
      text: 'Ending',
    });
  } else {
    skiptime.push({
      startTime: op?.interval?.endTime ?? 0,
      endTime: episodeLength,
      text: '',
    });
  }

  function onCanPlay() {
    if (skiptime && skiptime.length > 0) {
      const track = new TextTrack({
        kind: 'chapters',
        default: true,
        label: 'English',
        language: 'en-US',
        type: 'json'
      });
      for (const cue of skiptime) {
        track.addCue(new window.VTTCue(Number(cue.startTime), Number(cue.endTime), cue.text))
      }
      player.current.textTracks.add(track);
    }
  }

  const [opbutton, setopbutton] = useState(false);
  const [edbutton, setedbutton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showbutton, setshowbtn] = useState(true);

  useEffect(()=>{
    const btn = localStorage.getItem('showbtns');
    if(btn){
      setshowbtn(btn==='on');
    }
  },[])
  let interval;

  useEffect(() => {
    player.current?.subscribe(({ currentTime, duration }) => {

      if (skiptime && skiptime.length > 0) {
        const opStart = skiptime[0]?.startTime ?? 0;
        const opEnd = skiptime[0]?.endTime ?? 0;

        const epStart = skiptime[1]?.startTime ?? 0;
        const epEnd = skiptime[1]?.endTime ?? 0;

        const opButtonText = skiptime[0]?.text || "";
        const edButtonText = skiptime[1]?.text || "";

        setopbutton(opButtonText === "Opening" && (currentTime > opStart && currentTime < opEnd));
        setedbutton(edButtonText === "Ending" && (currentTime > epStart && currentTime < epEnd));

        const autoSkip = localStorage.getItem('autoSkip');
        if (autoSkip === 'on') {
          if (currentTime > opStart && currentTime < opEnd) {
            Object.assign(player.current ?? {}, { currentTime: opEnd });
            return null;
          }
          if (currentTime > epStart && currentTime < epEnd) {
            Object.assign(player.current ?? {}, { currentTime: epEnd });
            return null;
          }
        }
      }

    })

  }, []);

  function onEnded() {
    // if (!nextep?.id) return;
    const autoNext = localStorage.getItem('autoNext');
    if (autoNext) {

    }
  }

  function onTimeUpdate() {
    const currentTime = player.current?.currentTime;
    const timeToShowButton = duration - 8;
  
    const nextButton = document.querySelector(".nextbtn");
  
    if (showbutton && nextButton) {
      if (duration !== 0 && (currentTime > timeToShowButton)) {
        nextButton.classList.remove("hidden");
      } else {
        nextButton.classList.add("hidden");
      }
    }
  }

  function handleop() {
    console.log("Skipping Intro");
    Object.assign(player.current ?? {}, { currentTime: skiptime[0]?.endTime ?? 0 });
  }

  function handleed() {
    console.log("Skipping Outro");
    Object.assign(player.current ?? {}, { currentTime: skiptime[1]?.endTime ?? 0 });
  }


  return (
      <MediaPlayer
      className="w-full aspect-video bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-media-focus data-[focus]:ring-4"
      title="One Piece"
      src="https://www041.vipanicdn.net/streamhls/7f8dd00fcdec4483b9ff13f47a3ec4e2/ep.1.1696001423.m3u8"
      crossOrigin="anonymous"
      playsInline
      onCanPlay={onCanPlay}
      ref={player}
      onTimeUpdate={onTimeUpdate}
      streamType="on-demand"
    >
      <MediaProvider>
        {/* {textTracks.map((track) => (
          <Track {...track} key={track.src} />
        ))} */}
      </MediaProvider>
      {showbutton && opbutton && <button onClick={handleop} className='absolute bottom-[70px] sm:bottom-[83px] left-4 z-[40] bg-black bg-opacity-80 text-white py-2 px-3 rounded-lg font-medium text-base cursor-pointer text-left font-inter flex items-center animate-show border border-solid border-white border-opacity-10 gap-2'>
        <img src="/SkipButton.svg" alt="" />
        Skip Opening</button>}
      {showbutton && edbutton && <button onClick={handleed} className='absolute bottom-[70px] sm:bottom-[83px] left-4 z-[40] bg-black bg-opacity-80 text-white py-2 px-3 rounded-lg font-medium text-base cursor-pointer text-left font-inter flex items-center animate-show border border-solid border-white border-opacity-10 gap-2'>
        <img src="/SkipButton.svg" alt="" />
        Skip Ending</button>}
      <VideoLayout />
    </MediaPlayer>
  );
}
