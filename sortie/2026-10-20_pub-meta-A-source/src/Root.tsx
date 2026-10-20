import React from 'react';
import {Composition} from 'remotion';
import {Pub} from './Pub';
import timings from './timings.json';

export const Root: React.FC = () => (
  <Composition
    id="Pub"
    component={Pub}
    durationInFrames={Math.round(timings.duration * 30)}
    fps={30}
    width={1080}
    height={1920}
  />
);
