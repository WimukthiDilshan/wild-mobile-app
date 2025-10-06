// Media picker removed — stub module kept to avoid runtime 'require' errors
// If any code still calls this, it'll throw with a clear message.
export default {
  async pickMedia() {
    throw new Error('Media picker was removed from this build. Do not call pickMedia()');
  },
};
