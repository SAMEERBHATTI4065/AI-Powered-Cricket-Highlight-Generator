from django import forms


class VideoUploadForm(forms.Form):
    """Simple form for video file upload"""
    video_file = forms.FileField(
        label='Select Cricket Match Video',
        help_text='Upload MP4, AVI, or MOV format',
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'video/*'
        })
    )
    
    def clean_video_file(self):
        video = self.cleaned_data.get('video_file')
        if video:
            # Check file extension
            valid_extensions = ['.mp4', '.avi', '.mov', '.mkv']
            ext = video.name.lower()[video.name.rfind('.'):]
            if ext not in valid_extensions:
                raise forms.ValidationError('Please upload a valid video file (MP4, AVI, MOV, MKV)')
            
            # No file size limit - allow large cricket match videos
        
        return video
