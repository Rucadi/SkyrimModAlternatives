import { announceList } from 'create-torrent'
import wrtc from 'wrtc'
import util from './utils.js'

globalThis.WEBTORRENT_ANNOUNCE = announceList.concat(util.getAnnounceList())
  .map(arr => arr[0])
  .filter(url => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0)

globalThis.WRTC = wrtc
export { default } from 'webtorrent'
