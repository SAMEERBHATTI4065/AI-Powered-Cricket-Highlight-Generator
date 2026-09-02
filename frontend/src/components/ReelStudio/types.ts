export type AspectRatio = '9:16' | '1:1' | '4:5';
export type CameraLayout = 'smart_focus' | 'split_stack' | 'ambient';
export type CaptionStyle = 'bold' | 'minimal' | 'off';

export interface ReelStudioState {
  momentId: string | number;
  aspectRatio: AspectRatio;
  cameraLayout: CameraLayout;
  captionStyle: CaptionStyle;
  hypeSoundTrack: boolean;
}
