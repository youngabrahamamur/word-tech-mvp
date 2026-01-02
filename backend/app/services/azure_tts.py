import azure.cognitiveservices.speech as speechsdk
import os

def generate_audio_file(text, filename):
    speech_config = speechsdk.SpeechConfig(subscription="YourKey", region="YourRegion")
    speech_config.speech_synthesis_voice_name='en-US-JennyNeural' # 效果很好的女声
    
    # 直接输出到文件
    file_config = speechsdk.audio.AudioOutputConfig(filename=filename)
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=file_config)
    
    result = synthesizer.speak_text_async(text).get()
    
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return True
    return False
