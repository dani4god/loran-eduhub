'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  usePathname,
  useRouter,
} from 'next/navigation'

import {
  Loader2,
} from 'lucide-react'

export default function ExamPrepAccessGate({
  children,
}: {
  children:
    React.ReactNode
}) {
  const router =
    useRouter()

  const pathname =
    usePathname()

  const [
    checking,
    setChecking,
  ] =
    useState(
      true
    )

  /*
   * These pages must remain accessible even when the
   * subscription is expired or has not yet been purchased.
   */
  const subscriptionPage =
    pathname ===
      '/exam-prep/dashboard/subscription' ||
    pathname ===
      '/exam-prep/dashboard/subscribe'

  useEffect(
    () => {
      let cancelled =
        false

      async function checkAccess() {
        /*
         * Never block the subscription page itself.
         */
        if (
          subscriptionPage
        ) {
          setChecking(
            false
          )

          return
        }

        try {
          const response =
            await fetch(
              '/api/exam-prep/subscription',
              {
                method:
                  'GET',

                cache:
                  'no-store',

                credentials:
                  'include',
              }
            )

          if (
            cancelled
          ) {
            return
          }

          if (
            response.status ===
            401
          ) {
            router.replace(
              '/exam-prep/login'
            )

            return
          }

          const data =
            await response.json()

          if (
            !response.ok
          ) {
            /*
             * A temporary API failure should not permanently
             * lock the UI without explanation. Existing protected
             * APIs still enforce subscription access server-side.
             */
            console.error(
              'Exam Prep subscription check failed:',
              data
            )

            setChecking(
              false
            )

            return
          }

          /*
           * Paid system + no valid access:
           * send student straight to subscription management.
           */
          if (
            data?.requiresPayment ===
            true
          ) {
            router.replace(
              '/exam-prep/dashboard/subscription'
            )

            return
          }

          setChecking(
            false
          )
        } catch (
          error
        ) {
          console.error(
            'Exam Prep access check error:',
            error
          )

          if (
            !cancelled
          ) {
            setChecking(
              false
            )
          }
        }
      }

      checkAccess()

      return () => {
        cancelled =
          true
      }
    },
    [
      router,
      subscriptionPage,
      pathname,
    ]
  )

  if (
    checking
  ) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

          <p className="mt-3 text-xs font-medium text-slate-500">
            Checking Exam Prep access...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
    </>
  )
}