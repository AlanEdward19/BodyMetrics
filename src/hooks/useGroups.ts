import { useGroupContext } from '../contexts/GroupContext';

export function useGroups() {
  return useGroupContext();
}
