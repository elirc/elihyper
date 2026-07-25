import * as React from 'react'
import { useRouter } from 'next/router'
import { PlasmicNavigationLink, DefaultNavigationLinkProps } from './plasmic/hypernova_inc/PlasmicNavigationLink'
import { HTMLElementRefOf } from '@plasmicapp/react-web'

export interface NavigationLinkProps extends DefaultNavigationLinkProps {}

function NavigationLink_(props: NavigationLinkProps, ref: HTMLElementRefOf<'button'>) {
  const router = useRouter()
  const { destination, ...restProps } = props
  const target = destination ?? '#'
  const isHashLink = target.startsWith('#')

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isHashLink) {
        event?.preventDefault()
        event.stopPropagation()
        const anchorId = target.slice(1)
        if (anchorId && typeof document !== 'undefined') {
          // Update URL hash first
          window.history.pushState(null, '', `#${anchorId}`)

          // Use multiple requestAnimationFrame calls to ensure this happens
          // after any scroll restoration code has finished
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const element = document.getElementById(anchorId)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            })
          })
        }
        return
      }

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }

      router.push(target, undefined, { scroll: true }).catch(() => {
        // Ignore navigation abort errors (e.g., route changed before completion)
      })
    },
    [router, target, isHashLink]
  )

  const handleLinkClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (isHashLink) {
        event.preventDefault()
        event.stopPropagation()
      }
    },
    [isHashLink]
  )

  return (
    <PlasmicNavigationLink
      root={{
        ref: ref,
        onClick: handleClick,
      }}
      link={{
        onClick: handleLinkClick,
        href: isHashLink ? router.asPath.split('#')[0] || '/' : target,
      }}
      {...restProps}
      destination={isHashLink ? router.asPath.split('#')[0] || '/' : target}
    />
  )
}

const NavigationLink = React.forwardRef(NavigationLink_)
export default NavigationLink
