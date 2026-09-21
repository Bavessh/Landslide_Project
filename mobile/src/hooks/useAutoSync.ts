import { useEffect } from 'react'
import {
  AppState,
  type AppStateStatus,
} from 'react-native'
import NetInfo from '@react-native-community/netinfo'

import {
  syncPendingReports,
} from '../sync/syncEngine'

export function useAutoSync() {
  useEffect(() => {
    void syncPendingReports()

    const unsubscribeNetwork =
      NetInfo.addEventListener((state) => {
        if (state.isConnected) {
          void syncPendingReports()
        }
      })

    const appStateSubscription =
      AppState.addEventListener(
        'change',
        (state: AppStateStatus) => {
          if (state === 'active') {
            void syncPendingReports()
          }
        },
      )

    return () => {
      unsubscribeNetwork()
      appStateSubscription.remove()
    }
  }, [])
}
