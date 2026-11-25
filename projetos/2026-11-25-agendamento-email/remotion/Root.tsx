import {Composition} from 'remotion';
import {Agenda} from './cenas/Agenda';
import {Thumbnail} from './cenas/Thumbnail';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Reels" component={Agenda} durationInFrames={1163} fps={30} width={1080} height={1920} />
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
