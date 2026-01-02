import { create } from 'zustand';
import client from '../api/client';

const useStudyStore = create((set, get) => ({
  queue: [],        // 待背单词队列
  currentIndex: 0,  // 当前背到第几个
  isLoading: false,
  isFinished: false, // 是否背完

  // 初始化：从后端拉取单词
  fetchQueue: async () => {
    set({ isLoading: true, isFinished: false });
    try {
      const data = await client.get('/study/queue');
      set({ queue: data, currentIndex: 0, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  // 提交结果并切换下一个
  submitResult: async (quality) => {
    const { queue, currentIndex } = get();
    const currentWord = queue[currentIndex];

    // 1. 乐观更新：先切到下一张卡片，让用户感觉不到延迟
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ isFinished: true });
    }

    // 2. 后台默默提交给 Python
    try {
      await client.post('/study/submit', {
        word_id: currentWord.id,
        quality: quality // 0=忘记, 3=模糊, 5=认识
      });
    } catch (e) {
      console.error("提交失败", e);
    }
  },

  // 播放发音 (调用有道 API)
  playAudio: (word) => {
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${word}&type=1`; // type=1 美音
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.log("播放失败", e));
  }
}));

export default useStudyStore;
