import { useEffect, useState } from 'react';

interface CmdOrCtrlOptions {
  cmd?: string;
  ctrl?: string;
  isMacLike?: () => boolean;
}

const defaultMacLikeRe = /mac|iPhone|iPod|iPad/i;
const defaultIsMacLike = () =>
  typeof navigator !== 'undefined' && defaultMacLikeRe.test(navigator.platform);

export default function useCmdOrCtrl({
  cmd = '⌘',
  ctrl = 'ctrl',
  isMacLike = defaultIsMacLike,
}: CmdOrCtrlOptions = {}): string {
  const [cmdOrCtrl, setCmdOrCtrl] = useState(ctrl);
  useEffect(() => {
    setCmdOrCtrl(isMacLike() ? cmd : ctrl);
  }, [cmd, ctrl, isMacLike]);
  return cmdOrCtrl;
}
