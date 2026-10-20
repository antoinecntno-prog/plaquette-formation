import React from 'react';
import {Composition} from 'remotion';
import timings from './timings.json';
import {Pub3} from './v3/Pub3';

export const Root: React.FC = () => (
  <Composition id="Pub3" component={Pub3} durationInFrames={Math.round(timings.duration * 30)} fps={30} width={1080} height={1920} />
);
