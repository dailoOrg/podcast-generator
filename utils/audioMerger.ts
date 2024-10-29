export async function mergeAudioFiles(audioUrls: string[]): Promise<Blob> {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffers = await Promise.all(
    audioUrls.map(async (url) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await audioContext.decodeAudioData(arrayBuffer);
    })
  );

  // Calculate total duration
  const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
  const numberOfChannels = audioBuffers[0].numberOfChannels;
  const sampleRate = audioBuffers[0].sampleRate;

  // Create new buffer for merged audio
  const mergedBuffer = audioContext.createBuffer(
    numberOfChannels,
    totalLength,
    sampleRate
  );

  // Merge buffers
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const mergedChannelData = mergedBuffer.getChannelData(channel);
    let offset = 0;

    audioBuffers.forEach((buffer) => {
      const channelData = buffer.getChannelData(channel);
      mergedChannelData.set(channelData, offset);
      offset += buffer.length;
    });
  }

  // Convert merged buffer to blob
  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    totalLength,
    sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = mergedBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();

  // Convert AudioBuffer to WAV format
  const wavBlob = await new Promise<Blob>((resolve) => {
    const channels = [];
    for (let i = 0; i < renderedBuffer.numberOfChannels; i++) {
      channels.push(renderedBuffer.getChannelData(i));
    }

    const interleaved = interleaveChannels(channels, renderedBuffer.length);
    const dataView = encodeWAV(interleaved, renderedBuffer.numberOfChannels, renderedBuffer.sampleRate);
    const audioBlob = new Blob([dataView], { type: 'audio/wav' });
    resolve(audioBlob);
  });

  return wavBlob;
}

function interleaveChannels(channels: Float32Array[], frameCount: number): Float32Array {
  const interleaved = new Float32Array(frameCount * channels.length);
  
  for (let i = 0; i < frameCount; i++) {
    for (let channel = 0; channel < channels.length; channel++) {
      interleaved[i * channels.length + channel] = channels[channel][i];
    }
  }
  
  return interleaved;
}

function encodeWAV(samples: Float32Array, numChannels: number, sampleRate: number): DataView {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
} 