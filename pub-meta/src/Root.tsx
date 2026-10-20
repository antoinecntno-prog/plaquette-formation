import React from 'react';
import {Composition} from 'remotion';
import {Pub, FPS, W, H, LEAD} from './Pub';
import timing from './timing.json';

export const Root: React.FC = () => {
  const frames = Math.ceil((timing.audio_end + LEAD + 4.0) * FPS);
  return (
    <Composition id="pub" component={Pub} durationInFrames={frames} fps={FPS} width={W} height={H} />
  );
};
