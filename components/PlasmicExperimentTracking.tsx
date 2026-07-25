import * as React from 'react'
import { useRouter } from 'next/router'
import { getActiveVariation, getExternalIds } from '@plasmicapp/react-web/lib/splits'

import PlasmicSplitsProvider, { splits } from './plasmic/hypernova_inc/PlasmicSplitsProvider'

export type PlasmicExternalIds = Record<string, string>
export type PlasmicKnownSplitValues = Record<string, string>

const KNOWN_SPLIT_STORAGE_PREFIX = 'plasmic_split_known:'

function stripQueryAndHash(path: string): string {
  // `asPath` can be like "/foo?bar=baz#hash"
  const q = path.indexOf('?')
  const h = path.indexOf('#')
  const cut = Math.min(q === -1 ? path.length : q, h === -1 ? path.length : h)
  return path.slice(0, cut) || '/'
}

function safeGetKnownValue(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem(`${KNOWN_SPLIT_STORAGE_PREFIX}${key}`) ?? undefined
  } catch {
    return undefined
  }
}

function safeUpdateKnownValue(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${KNOWN_SPLIT_STORAGE_PREFIX}${key}`, value)
  } catch {
    // ignore (storage disabled / quota / privacy mode)
  }
}

function computeExternalIdsFromVariation(variation: Record<string, string>): PlasmicExternalIds {
  return getExternalIds(splits as any, variation)
}

function pushPlasmicExperimentImpression(externalIds: PlasmicExternalIds, pagePathname: string) {
  if (typeof window === 'undefined') return
  if (!externalIds || Object.keys(externalIds).length === 0) return

  const plasmicExpVariant = Object.entries(externalIds)
    .map(([exp, variant]) => `${exp}:${variant}`)
    .join('|')

  window.dataLayer = window.dataLayer || []

  // Persist the active experiment assignment into GTM's data model (no `event`),
  // so ALL subsequent tags/events (conversions included) can read it reliably via
  // a Data Layer Variable, even if the triggering event doesn't include it.
  window.dataLayer.push({
    plasmic_exp_variant: plasmicExpVariant,
    ...externalIds,
  })

  window.dataLayer.push({
    event: 'plasmic_experiment_impression',
    page_path: pagePathname,
    plasmic_exp_variant: plasmicExpVariant,
    ...externalIds,
  })
}

function PlasmicExperimentImpressionTracker(props: { externalIds: PlasmicExternalIds }) {
  const router = useRouter()
  const lastFiredKeyRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const fire = (url: string) => {
      const key = url || router.asPath || window.location.pathname + window.location.search + window.location.hash
      const externalKey = Object.entries(props.externalIds)
        .map(([exp, variant]) => `${exp}:${variant}`)
        .sort()
        .join('|')
      const dedupeKey = `${key}__${externalKey}`
      if (lastFiredKeyRef.current === dedupeKey) return
      lastFiredKeyRef.current = dedupeKey

      const pagePathname = stripQueryAndHash(key)
      pushPlasmicExperimentImpression(props.externalIds, pagePathname)
    }

    // Initial page load
    fire(router.asPath)

    // Client-side route changes
    router.events.on('routeChangeComplete', fire)
    return () => {
      router.events.off('routeChangeComplete', fire)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.events, router.asPath, props.externalIds])

  return null
}

export function PlasmicSplitsAppProvider(
  props: React.PropsWithChildren<{
    initialKnownValues?: PlasmicKnownSplitValues
  }>
) {
  const initialKnownValues = props.initialKnownValues

  return initialKnownValues ? (
    <SsrSplitsProvider initialKnownValues={initialKnownValues}>{props.children}</SsrSplitsProvider>
  ) : (
    <ClientSplitsProvider>{props.children}</ClientSplitsProvider>
  )
}

function SsrSplitsProvider(
  props: React.PropsWithChildren<{
    initialKnownValues: PlasmicKnownSplitValues
  }>
) {
  const initialKnownValues = props.initialKnownValues

  // Compute synchronously so SSR + hydration render the assigned variant immediately.
  const variation = React.useMemo(
    () =>
      getActiveVariation({
        splits,
        traits: {},
        getKnownValue: (key: string) => initialKnownValues[key],
        // No need to update during render; server already set cookies in getServerSideProps.
        updateKnownValue: () => {},
        enableUnseededExperiments: true,
      }),
    [initialKnownValues]
  )

  const externalIds = React.useMemo(() => computeExternalIdsFromVariation(variation), [variation])

  // On client, persist SSR assignment to localStorage so client-side navigations are sticky.
  React.useEffect(() => {
    Object.entries(initialKnownValues).forEach(([k, v]) => safeUpdateKnownValue(k, v))
  }, [initialKnownValues])

  return (
    <PlasmicSplitsProvider
      traits={{}}
      getKnownValue={(key: string) => initialKnownValues[key]}
      updateKnownValue={() => {}}
      enableUnseededExperiments={true}>
      <PlasmicExperimentImpressionTracker externalIds={externalIds} />
      {props.children}
    </PlasmicSplitsProvider>
  )
}

function ClientSplitsProvider(props: React.PropsWithChildren) {
  // For SSG pages: avoid hydration mismatch by initially rendering the default (control)
  // and then applying the stored/randomized split on client.
  const [splitsProviderProps, setSplitsProviderProps] = React.useState<{
    getKnownValue?: (key: string) => string | undefined
    updateKnownValue?: (key: string, value: string) => void
    enableUnseededExperiments?: boolean
  }>({})
  const [externalIds, setExternalIds] = React.useState<PlasmicExternalIds>({})

  React.useEffect(() => {
    const providerProps = {
      getKnownValue: safeGetKnownValue,
      updateKnownValue: safeUpdateKnownValue,
      enableUnseededExperiments: true,
    }
    const variation = getActiveVariation({
      splits,
      traits: {},
      ...providerProps,
    })
    setSplitsProviderProps(providerProps)
    setExternalIds(computeExternalIdsFromVariation(variation))
  }, [])

  return (
    <PlasmicSplitsProvider traits={{}} {...splitsProviderProps}>
      <PlasmicExperimentImpressionTracker externalIds={externalIds} />
      {props.children}
    </PlasmicSplitsProvider>
  )
}
