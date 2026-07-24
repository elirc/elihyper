import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import styles from './ThreeAstronaut.module.css'

export type AstronautSceneApi = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  model?: THREE.Object3D
  mixer?: THREE.AnimationMixer
  playIdle?: () => void
  playMoonWalk?: () => void
  playWave?: () => void
}

type AstronautSceneProps = {
  modelUrl?: string
  onReady?: (api: AstronautSceneApi) => void
  showControls?: boolean
  isMobile?: boolean
}

export default function AstronautScene({
  modelUrl = '/source/Walking astronaut.glb',
  onReady,
  showControls = true,
  isMobile = false,
}: AstronautSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isTablet, setIsTablet] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState<'float' | 'moonWalk' | 'wave' | null>(null)
  const [hasAnimations, setHasAnimations] = useState({ float: false, moonWalk: false, wave: false })
  const [isClient, setIsClient] = useState(false)
  const [modelLayoutVersion, setModelLayoutVersion] = useState(0)
  const [loaderPhase, setLoaderPhase] = useState<'loading' | 'fading' | 'done'>('loading')
  const [loadProgress, setLoadProgress] = useState<number | null>(null)
  const [controlsPos, setControlsPos] = useState<{ left: number; top: number; visible: boolean }>({
    left: 0,
    top: 0,
    visible: false,
  })
  const headRef = useRef<THREE.Bone | THREE.Mesh | THREE.Group | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const modelBoundsRef = useRef<{ center: THREE.Vector3; size: THREE.Vector3 } | null>(null)
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const headRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const animationActionsRef = useRef<{
    idle: THREE.AnimationAction | null
    moonWalk: THREE.AnimationAction | null
    wave: THREE.AnimationAction | null
    current: THREE.AnimationAction | null
  }>({ idle: null, moonWalk: null, wave: null, current: null })
  const moonWalkTimerRef = useRef<number | null>(null)

  // Hover tracking refs (GA4 via GTM)
  const isHoveringRef = useRef<boolean>(false)
  const hoverStartTimeRef = useRef<number>(0)
  const currentTrackRef = useRef<string>('idle')
  const onReadyRef = useRef(onReady)
  const isInitializedRef = useRef(false)
  const floatOffsetRef = useRef<number>(0)
  const floatTimeRef = useRef<number>(0)
  const loaderFadeTimerRef = useRef<number | null>(null)

  // Drag-to-rotate refs
  const userRotationYRef = useRef<number>(0)
  const dragRef = useRef<{ active: boolean; pointerId: number | null; lastClientX: number }>({
    active: false,
    pointerId: null,
    lastClientX: 0,
  })

  // Update onReady ref when it changes
  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const model = modelRef.current
    const bounds = modelBoundsRef.current
    if (!model || !bounds) return

    const mobileXNudge = 0.06
    const desktopXNudge = bounds.size.x * 0.05
    model.position.x = isMobile ? -bounds.center.x + bounds.size.x * mobileXNudge : desktopXNudge
  }, [isMobile, modelLayoutVersion])

  // Keep the controls visually "attached" to the astronaut container, but rendered via portal
  // so they aren't blocked by Plasmic layout/stacking contexts.
  useEffect(() => {
    if (!isClient) return
    let raf = 0

    const update = () => {
      const el = containerRef.current
      if (!el) {
        setControlsPos((p) => (p.visible ? { ...p, visible: false } : p))
        raf = window.requestAnimationFrame(update)
        return
      }

      const rect = el.getBoundingClientRect()
      const visible = rect.width > 0 && rect.height > 0

      // Anchor to bottom-right of astronaut container
      const inset = 14
      const left = Math.round(rect.right - inset)
      const top = Math.round(rect.bottom - rect.height * 0.2 - inset)

      setControlsPos((prev) => {
        if (prev.visible === visible && prev.left === left && prev.top === top) return prev
        return { left, top, visible }
      })

      raf = window.requestAnimationFrame(update)
    }

    raf = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(raf)
  }, [isClient])

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth <= 1024)
    }
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

  // "Hover" session tracking (start/end) via dataLayer custom events.
  // We intentionally scope this to a page section ("tracking zone") so we don't count time
  // when the cursor is interacting with completely different sections of the page.
  useEffect(() => {
    const getZoneEl = (): HTMLElement | null => {
      const container = containerRef.current
      if (!container) return null
      const zone = container.closest('[data-astronaut-tracking-zone]') as HTMLElement | null
      return zone || container
    }

    const zoneEl = getZoneEl()
    let zoneIsVisible = true
    let observer: IntersectionObserver | null = null

    const startSession = () => {
      if (isHoveringRef.current) return

      const el = zoneEl
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      if (!zoneIsVisible) return

      isHoveringRef.current = true
      hoverStartTimeRef.current = performance.now()

      try {
        ;(window as any).dataLayer?.push?.({
          event: 'astronaut_hover_session_start',
          active_track: currentTrackRef.current,
          astronaut_variant: 'threejs',
          variant: 'threejs',
        })
      } catch {}
    }

    const endSession = () => {
      if (!isHoveringRef.current) return

      isHoveringRef.current = false
      const hoverEndTime = performance.now()
      const durationMs = hoverEndTime - hoverStartTimeRef.current
      const durationS = parseFloat((durationMs / 1000).toFixed(2))

      try {
        ;(window as any).dataLayer?.push?.({
          event: 'astronaut_hover_session_end',
          active_track: currentTrackRef.current,
          duration_s: durationS,
          astronaut_variant: 'threejs',
          variant: 'threejs',
        })
      } catch {}
    }

    if (zoneEl && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          zoneIsVisible = !!entry && (entry.isIntersecting || entry.intersectionRatio > 0.05)
          if (!zoneIsVisible) {
            endSession()
          }
        },
        { threshold: [0, 0.05, 0.1] }
      )
      observer.observe(zoneEl)
    }

    const onAnyPointerMove = (event: PointerEvent) => {
      const el = zoneEl
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const isInsideZone =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (isInsideZone && zoneIsVisible) {
        startSession()
      } else {
        endSession()
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endSession()
      }
    }

    const onWindowBlur = () => {
      endSession()
    }

    const onLeaveDocument = () => {
      endSession()
    }

    window.addEventListener('pointermove', onAnyPointerMove, { passive: true })
    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.documentElement.addEventListener('pointerleave', onLeaveDocument)
    document.documentElement.addEventListener('mouseleave', onLeaveDocument)

    return () => {
      // End any active session on unmount so we don't leave "dangling" sessions.
      endSession()
      observer?.disconnect()
      window.removeEventListener('pointermove', onAnyPointerMove as any)
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.documentElement.removeEventListener('pointerleave', onLeaveDocument as any)
      document.documentElement.removeEventListener('mouseleave', onLeaveDocument as any)
    }
  }, [])

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('Skipping duplicate model load')
      return // Prevent double initialization
    }
    const container = containerRef.current
    if (!container) return

    // Guard to prevent double initialization in React StrictMode
    let isInitialized = false

    // Check if device is tablet or mobile for feature toggling
    const isTabletOrMobile = window.innerWidth <= 1024

    // Reset loader UI on (re)load
    setLoaderPhase('loading')
    setLoadProgress(null)
    if (loaderFadeTimerRef.current) {
      window.clearTimeout(loaderFadeTimerRef.current)
      loaderFadeTimerRef.current = null
    }

    /* ---------------- Renderer ---------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    // Cap pixel ratio at 2 to avoid performance issues while maintaining quality
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    // Fade the canvas in once the model is ready (feels slicker than a hard pop-in)
    renderer.domElement.style.opacity = '0'
    renderer.domElement.style.transition = 'opacity 450ms ease'
    container.appendChild(renderer.domElement)

    /* ---------------- Scene ---------------- */
    const scene = new THREE.Scene()
    // Set background to null for transparency
    scene.background = null

    // Create environment map for reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    // Create environment scene with visible light sources for reflections
    const envScene = new THREE.Scene()
    envScene.background = new THREE.Color(0x000011) // Dark blue space

    // Add bright light sources that will show in reflections
    const envLight1 = new THREE.DirectionalLight(0xffffff, 2.0)
    envLight1.position.set(10, 10, 10)
    envScene.add(envLight1)

    const envLight2 = new THREE.DirectionalLight(0x88aaff, 1.5)
    envLight2.position.set(-10, 5, -10)
    envScene.add(envLight2)

    const envLight3 = new THREE.DirectionalLight(0xffffff, 1.0)
    envLight3.position.set(0, -10, 0)
    envScene.add(envLight3)

    // Add some bright point lights for more reflection detail
    const pointLight1 = new THREE.PointLight(0xffffff, 3, 50)
    pointLight1.position.set(15, 15, 15)
    envScene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xaaccff, 2, 50)
    pointLight2.position.set(-15, 10, -15)
    envScene.add(pointLight2)

    // Create environment map from the scene
    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture
    scene.environment = envMap

    // Create starfield
    const starsGeometry = new THREE.BufferGeometry()
    const starsVertices = []
    const starsCount = 5000

    for (let i = 0; i < starsCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 500 + Math.random() * 200
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      starsVertices.push(x, y, z)
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3))
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: false })
    )
    scene.add(stars)

    /* ---------------- Camera ---------------- */
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(6, 8, 14)

    /* ---------------- Controls ---------------- */
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enabled = false
    // Set the pivot point (target) - the camera will orbit around this point
    controls.target.set(0, 0, 0)
    controls.update()

    /* ---------------- Lighting ---------------- */
    // Professional lighting setup for realistic materials
    // Lower ambient so shadows read better
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)

    // Key light (acts like a sun) with tuned shadow settings
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2)
    mainLight.position.set(8, 14, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 8192
    mainLight.shadow.mapSize.height = 8192
    mainLight.shadow.bias = -0.00001
    mainLight.shadow.normalBias = 0.01
    mainLight.shadow.radius = 8

    // Keep the shadow camera tight for better resolution
    const shadowCam = mainLight.shadow.camera
    shadowCam.left = -5
    shadowCam.right = 5
    shadowCam.top = 8
    shadowCam.bottom = -5
    shadowCam.near = 0.5
    shadowCam.far = 40
    shadowCam.updateProjectionMatrix()
    scene.add(mainLight)

    // Fill light for softer shadows
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.55)
    fillLight.position.set(-5, 3, -5)
    scene.add(fillLight)

    // Slightly cool rim for separation
    const rimLight = new THREE.DirectionalLight(0x88aaff, 0.85)
    rimLight.position.set(0, 5, -10)
    scene.add(rimLight)

    // Shared light target so the directional lights always "look at" the astronaut
    const astronautLightTarget = new THREE.Object3D()
    scene.add(astronautLightTarget)
    mainLight.target = astronautLightTarget
    fillLight.target = astronautLightTarget
    rimLight.target = astronautLightTarget

    // A small camera-aligned light to create nice specular highlights ("shiny") without flattening shadows
    const cameraLight = new THREE.PointLight(0xffffff, 0.6, 100)
    cameraLight.castShadow = false
    scene.add(cameraLight)

    // Add invisible ground plane to receive shadows
    const groundGeometry = new THREE.PlaneGeometry(100, 100)
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.25 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -3
    ground.receiveShadow = true
    scene.add(ground)

    /* ---------------- Mouse Tracking ---------------- */
    const mouse = mouseRef.current
    const raycaster = new THREE.Raycaster()

    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return // Guard against zero-sized container

      const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const normalizedY = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Update the Vector2 object directly
      mouse.x = normalizedX
      mouse.y = normalizedY

      // Also update the ref to ensure it's synced
      mouseRef.current.x = normalizedX
      mouseRef.current.y = normalizedY
    }

    // Attach mouse event listener to document for global tracking
    document.addEventListener('mousemove', onMouseMove)

    /* ---------------- Drag to Rotate ---------------- */
    const dragRaycaster = new THREE.Raycaster()
    const dragNdc = new THREE.Vector2()

    const setNdcFromPointerEvent = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return false
      dragNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      dragNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      return true
    }

    const tryStartDrag = (event: PointerEvent) => {
      if (event.button !== 0) return // left click only
      const model = modelRef.current
      if (!model) return
      if (!setNdcFromPointerEvent(event)) return

      dragRaycaster.setFromCamera(dragNdc, camera)
      const hits = dragRaycaster.intersectObject(model, true)
      if (hits.length === 0) return

      dragRef.current.active = true
      dragRef.current.pointerId = event.pointerId
      dragRef.current.lastClientX = event.clientX

      try {
        renderer.domElement.setPointerCapture(event.pointerId)
      } catch {
        // ignore
      }

      renderer.domElement.style.cursor = 'grabbing'
      event.preventDefault()
    }

    const onDragMove = (event: PointerEvent) => {
      if (!dragRef.current.active || event.pointerId !== dragRef.current.pointerId) return

      const dx = event.clientX - dragRef.current.lastClientX
      dragRef.current.lastClientX = event.clientX

      // Spin sensitivity: radians per pixel.
      const speed = 0.01
      userRotationYRef.current += dx * speed
      event.preventDefault()
    }

    const endDrag = (event?: PointerEvent) => {
      if (!dragRef.current.active) return
      if (event?.pointerId !== undefined && event.pointerId !== dragRef.current.pointerId) return

      dragRef.current.active = false
      dragRef.current.pointerId = null
      renderer.domElement.style.cursor = 'grab'
    }

    const onPointerDown = (e: PointerEvent) => {
      e.stopPropagation()
      tryStartDrag(e)
    }

    const onPointerMove = (e: PointerEvent) => {
      onDragMove(e)
    }

    const onPointerUp = (e: PointerEvent) => {
      endDrag(e)
    }

    const onPointerCancel = (e: PointerEvent) => {
      endDrag(e)
    }

    const onContextMenu = (e: Event) => {
      e.preventDefault()
    }

    const onDragStart = (e: Event) => {
      e.preventDefault()
    }

    const onSelectStart = (e: Event) => {
      e.preventDefault()
    }

    // Attach drag event listeners to canvas (desktop only)
    const canvas = renderer.domElement

    if (!isTabletOrMobile) {
      // Desktop only - enable drag-to-rotate
      canvas.addEventListener('pointerdown', onPointerDown)
      canvas.addEventListener('pointermove', onPointerMove)
      canvas.addEventListener('pointerup', onPointerUp)
      canvas.addEventListener('pointercancel', onPointerCancel)
      canvas.addEventListener('lostpointercapture', onPointerCancel)
      canvas.addEventListener('contextmenu', onContextMenu)
      canvas.addEventListener('dragstart', onDragStart)
      canvas.addEventListener('selectstart', onSelectStart)

      // Apply cursor styles for desktop
      canvas.style.cursor = 'grab'
      canvas.style.userSelect = 'none'
      canvas.style.touchAction = 'none'
      canvas.style.pointerEvents = 'auto' // Capture pointer events for dragging
    } else {
      // Mobile/tablet - allow clicks to pass through to elements behind
      canvas.style.cursor = 'default'
      canvas.style.touchAction = 'pan-y' // Allow vertical scrolling
      canvas.style.pointerEvents = 'none' // Let clicks pass through
    }

    // Common styles for all devices
    canvas.style.position = 'relative'
    canvas.style.zIndex = '10'

    /* ---------------- Model / Animation ---------------- */
    // Helper function to normalize animation names
    function normalizeName(name: string): string {
      return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
    }

    // Set up LoadingManager for proper texture path handling
    const loadingManager = new THREE.LoadingManager()
    loadingManager.setURLModifier((url) => {
      // Only modify external texture URLs, not embedded data URIs
      if (
        url.match(/\.(jpg|jpeg|png|gif|webp)$/i) &&
        !url.includes('/textures/') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        const filename = url.split('/').pop()?.split('\\').pop()
        const newUrl = `/textures/${filename}`
        console.log('Redirecting texture:', url, '->', newUrl)
        return newUrl
      }
      return url
    })

    const loader = new GLTFLoader(loadingManager)
    // Register KHR_materials_pbrSpecularGlossiness extension to avoid warnings
    loader.register(() => ({ name: 'KHR_materials_pbrSpecularGlossiness' }))

    const clock = new THREE.Clock()

    // Function to apply KHR_materials_pbrSpecularGlossiness fallback textures
    async function applySpecGlossFallbackTextures(gltf: any, root: THREE.Object3D) {
      const parser = gltf?.parser
      const json = parser?.json
      const materialDefs = json?.materials
      if (!parser || !materialDefs || materialDefs.length === 0) return

      const patches: Array<{ material: THREE.Material; ext: any }> = []
      const seen = new Set()

      function getImageSize(image: any) {
        if (!image) return { width: 0, height: 0 }
        // ImageBitmap
        if (typeof image.width === 'number' && typeof image.height === 'number') {
          return { width: image.width, height: image.height }
        }
        // HTMLImageElement
        return { width: image.naturalWidth || image.width || 0, height: image.naturalHeight || image.height || 0 }
      }

      function copyTextureTransform(dst: THREE.Texture, src: THREE.Texture) {
        if (!dst || !src) return
        ;(dst as any).channel = (src as any).channel
        ;(dst as any).offset?.copy((src as any).offset)
        ;(dst as any).repeat?.copy((src as any).repeat)
        ;(dst as any).center?.copy((src as any).center)
        ;(dst as any).rotation = (src as any).rotation
        dst.wrapS = src.wrapS
        dst.wrapT = src.wrapT
        dst.magFilter = src.magFilter
        dst.minFilter = src.minFilter
        dst.anisotropy = src.anisotropy
        dst.generateMipmaps = src.generateMipmaps
        // Critical for glTF consistency: glTF textures are uploaded with flipY=false
        dst.flipY = src.flipY
        dst.premultiplyAlpha = src.premultiplyAlpha
        ;(dst as any).unpackAlignment = (src as any).unpackAlignment
        ;(dst as any).matrixAutoUpdate = (src as any).matrixAutoUpdate
        ;(dst as any).matrix?.copy((src as any).matrix)
      }

      function makeRoughnessFromGlossinessTexture(specGlossTexture: THREE.Texture, glossinessFactor = 1) {
        const img = specGlossTexture?.image
        const { width, height } = getImageSize(img)
        if (!width || !height) return null

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return null

        // NOTE: specGlossTexture RGB are specular color; A is glossiness. We derive roughness = 1 - gloss.
        ctx.drawImage(img as any, 0, 0, width, height)
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data
        const gFactor = Number.isFinite(glossinessFactor) ? THREE.MathUtils.clamp(glossinessFactor, 0, 1) : 1

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] / 255
          const gloss = a * gFactor
          const rough = 1 - gloss
          const v = Math.round(THREE.MathUtils.clamp(rough, 0, 1) * 255)
          data[i + 0] = v
          data[i + 1] = v // roughnessMap reads green channel
          data[i + 2] = v
          data[i + 3] = 255
        }

        ctx.putImageData(imageData, 0, 0)

        const roughnessTex = new THREE.CanvasTexture(canvas)
        roughnessTex.colorSpace = THREE.NoColorSpace
        copyTextureTransform(roughnessTex, specGlossTexture)
        roughnessTex.needsUpdate = true
        return roughnessTex
      }

      root.traverse((obj) => {
        if (!(obj as THREE.Mesh).isMesh || !(obj as THREE.Mesh).material) return
        const mesh = obj as THREE.Mesh
        const materialArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const materials: THREE.Material[] = materialArray.filter((m): m is THREE.Material => m !== null)

        materials.forEach((material: THREE.Material) => {
          if (!material || seen.has(material.uuid)) return
          seen.add(material.uuid)

          const assoc = parser.associations.get(material)
          const materialIndex = (assoc as any)?.materials
          if (materialIndex === undefined) return

          const materialDef = materialDefs[materialIndex]
          const ext = materialDef?.extensions?.KHR_materials_pbrSpecularGlossiness
          if (!ext) return

          patches.push({ material, ext })
        })
      })

      if (patches.length === 0) return

      console.log(`Applying KHR_materials_pbrSpecularGlossiness fallback to ${patches.length} material(s)...`)

      await Promise.all(
        patches.map(async ({ material, ext }) => {
          const mat = material as THREE.MeshStandardMaterial

          // Diffuse factor: [r,g,b,a]
          if (Array.isArray(ext.diffuseFactor) && ext.diffuseFactor.length >= 3 && mat.color) {
            mat.color.fromArray(ext.diffuseFactor)
            if (ext.diffuseFactor.length >= 4) {
              mat.opacity = ext.diffuseFactor[3]
              mat.transparent = mat.opacity < 1
            }
          }

          // Diffuse texture -> material.map (sRGB)
          if (ext.diffuseTexture) {
            await parser.assignTexture(mat, 'map', ext.diffuseTexture, THREE.SRGBColorSpace)
          }

          // Approximate spec/gloss workflow as non-metal and derive roughness from glossiness
          if ('roughness' in mat) {
            if (ext.specularGlossinessTexture && !mat.roughnessMap) {
              const tmp: any = {}
              const specGlossTex = await parser.assignTexture(tmp, 'specGloss', ext.specularGlossinessTexture)
              const roughnessTex = makeRoughnessFromGlossinessTexture(
                specGlossTex,
                typeof ext.glossinessFactor === 'number' ? ext.glossinessFactor : 1
              )

              if (roughnessTex) {
                mat.roughness = 1.0
                mat.roughnessMap = roughnessTex
              }
            } else if (typeof ext.glossinessFactor === 'number') {
              mat.roughness = THREE.MathUtils.clamp(1 - ext.glossinessFactor, 0, 1)
            }
          }
          if ('metalness' in mat) {
            mat.metalness = 0.0
          }

          mat.needsUpdate = true
        })
      )
    }

    let mixer: THREE.AnimationMixer | undefined
    let model: THREE.Object3D | undefined

    loader.load(
      modelUrl,
      async (gltf) => {
        isInitializedRef.current = true

        model = gltf.scene

        console.log('=== GLTF Loading Info ===')
        const gltfAny = gltf as any
        console.log('Textures in GLTF:', gltfAny.textures?.length || 0)
        console.log('Images in GLTF:', gltfAny.images?.length || 0)
        console.log('Materials in GLTF:', gltfAny.materials?.length || 0)

        if (gltfAny.textures) {
          gltfAny.textures.forEach((tex: any, idx: number) => {
            console.log(`Texture ${idx}:`, tex)
          })
        }

        if (gltfAny.images) {
          gltfAny.images.forEach((img: any, idx: number) => {
            console.log(`Image ${idx}:`, img)
          })
        }

        // Ensure base textures from KHR_materials_pbrSpecularGlossiness are applied (UVs intact)
        await applySpecGlossFallbackTextures(gltf, model)

        // Configure materials for realistic appearance
        model.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true

            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

              materials.forEach((material, matIndex) => {
                // Store original material properties to preserve texture mappings
                const originalMap = (material as THREE.MeshStandardMaterial).map
                const originalColor =
                  (material as THREE.MeshStandardMaterial).color?.clone() || new THREE.Color(0xffffff)

                console.log(`\n=== Processing Material ${matIndex} ===`)
                console.log('Material type:', material.type)
                console.log('Material name:', (material as THREE.MeshStandardMaterial).name || 'unnamed')

                // Log all existing textures
                console.log('Existing textures:', {
                  map: !!(material as THREE.MeshStandardMaterial).map,
                  normalMap: !!(material as THREE.MeshStandardMaterial).normalMap,
                  roughnessMap: !!(material as THREE.MeshStandardMaterial).roughnessMap,
                  metalnessMap: !!(material as THREE.MeshStandardMaterial).metalnessMap,
                  aoMap: !!(material as THREE.MeshStandardMaterial).aoMap,
                  emissiveMap: !!(material as THREE.MeshStandardMaterial).emissiveMap,
                })

                // Preserve original textures and mappings - minimal modification
                // CRITICAL: Preserve original texture map reference - don't replace it
                if (originalMap && (material as THREE.MeshStandardMaterial).map !== originalMap) {
                  ;(material as THREE.MeshStandardMaterial).map = originalMap
                  console.log('✓ Restored original texture map')
                }

                // CRITICAL: Don't modify textures if they already exist - preserve original mappings
                // Only configure color space if texture exists and needs it
                if ((material as THREE.MeshStandardMaterial).map) {
                  // Preserve original texture - just ensure proper color space
                  if ((material as THREE.MeshStandardMaterial).map!.colorSpace !== THREE.SRGBColorSpace) {
                    ;(material as THREE.MeshStandardMaterial).map!.colorSpace = THREE.SRGBColorSpace
                  }
                  // Ensure texture wrapping is preserved
                  if ((material as THREE.MeshStandardMaterial).map!.wrapS === undefined) {
                    ;(material as THREE.MeshStandardMaterial).map!.wrapS = THREE.RepeatWrapping
                  }
                  if ((material as THREE.MeshStandardMaterial).map!.wrapT === undefined) {
                    ;(material as THREE.MeshStandardMaterial).map!.wrapT = THREE.RepeatWrapping
                  }
                  const mapImage = (material as THREE.MeshStandardMaterial).map!.image as any
                  console.log('✓ Preserved texture map:', mapImage?.src || mapImage || 'embedded')
                }

                // Don't override material color - preserve original or use white if missing texture
                // Only set to white if color is black (default) or if no texture
                if ((material as THREE.MeshStandardMaterial).map && originalColor.getHex() === 0x000000) {
                  // Only change from black to white if original was black
                  ;(material as THREE.MeshStandardMaterial).color.setHex(0xffffff)
                } else {
                  // Preserve original color
                  ;(material as THREE.MeshStandardMaterial).color.copy(originalColor)
                }

                // Apply environment map for reflections (doesn't affect texture mapping)
                ;(material as THREE.MeshStandardMaterial).envMap = envMap
                ;(material as THREE.MeshStandardMaterial).envMapIntensity = 1.35 // Stronger reflections for a shinier look

                // Configure other texture maps - preserve original settings
                if ((material as THREE.MeshStandardMaterial).normalMap) {
                  // Normal maps are data textures (linear / no color space)
                  if ((material as THREE.MeshStandardMaterial).normalMap!.colorSpace !== THREE.NoColorSpace) {
                    ;(material as THREE.MeshStandardMaterial).normalMap!.colorSpace = THREE.NoColorSpace
                  }
                  if (!(material as THREE.MeshStandardMaterial).normalScale) {
                    ;(material as THREE.MeshStandardMaterial).normalScale = new THREE.Vector2(1, 1)
                  }
                }
                if (
                  (material as THREE.MeshStandardMaterial).roughnessMap &&
                  (material as THREE.MeshStandardMaterial).roughnessMap!.colorSpace !== THREE.NoColorSpace
                ) {
                  ;(material as THREE.MeshStandardMaterial).roughnessMap!.colorSpace = THREE.NoColorSpace
                }
                if (
                  (material as THREE.MeshStandardMaterial).metalnessMap &&
                  (material as THREE.MeshStandardMaterial).metalnessMap!.colorSpace !== THREE.NoColorSpace
                ) {
                  ;(material as THREE.MeshStandardMaterial).metalnessMap!.colorSpace = THREE.NoColorSpace
                }
                if (
                  (material as THREE.MeshStandardMaterial).aoMap &&
                  (material as THREE.MeshStandardMaterial).aoMap!.colorSpace !== THREE.NoColorSpace
                ) {
                  ;(material as THREE.MeshStandardMaterial).aoMap!.colorSpace = THREE.NoColorSpace
                }
                if (
                  (material as THREE.MeshStandardMaterial).emissiveMap &&
                  (material as THREE.MeshStandardMaterial).emissiveMap!.colorSpace !== THREE.SRGBColorSpace
                ) {
                  ;(material as THREE.MeshStandardMaterial).emissiveMap!.colorSpace = THREE.SRGBColorSpace
                }

                // Material properties - only set if not already defined
                if (
                  !(material as THREE.MeshStandardMaterial).roughnessMap &&
                  (material as THREE.MeshStandardMaterial).roughness === undefined
                ) {
                  ;(material as THREE.MeshStandardMaterial).roughness = 0.5 // Moderate roughness to show texture detail
                }
                if ((material as THREE.MeshStandardMaterial).metalness === undefined) {
                  ;(material as THREE.MeshStandardMaterial).metalness = 0.0 // Non-metallic fabric
                }

                // Add clearcoat for shine (if supported and not already set)
                if (
                  material.type === 'MeshPhysicalMaterial' &&
                  (material as THREE.MeshPhysicalMaterial).clearcoat === undefined
                ) {
                  ;(material as THREE.MeshPhysicalMaterial).clearcoat = 0.2 // Subtle clearcoat
                  ;(material as THREE.MeshPhysicalMaterial).clearcoatRoughness = 0.4
                }
              })
            }
          }
        })

        // Position model on right side, taking up 1/3 of viewport
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        modelBoundsRef.current = { center: center.clone(), size: size.clone() }

        // Center model at origin first, then adjust position
        model.position.x = -center.x
        model.position.y = -center.y - 0.5 // Slightly lower the astronaut
        model.position.z = -center.z

        scene.add(model)
        modelRef.current = model
        setModelLayoutVersion((v) => v + 1)

        // Set up animations
        if (gltf.animations && gltf.animations.length > 0) {
          // Create mixer if not already created
          if (!mixer) {
            mixer = new THREE.AnimationMixer(model)
          }

          const clips = gltf.animations
          console.log(
            'Animation clips:',
            clips.map((c) => c.name)
          )

          const idleClip = clips.find((c) => normalizeName(c.name).includes('idle')) || clips[0]
          const moonWalkClip =
            clips.find((c) => normalizeName(c.name).includes('moonwalk')) ||
            clips.find((c) => {
              const n = normalizeName(c.name)
              return n.includes('moon') && n.includes('walk')
            })

          const waveClip = clips.find((c) => normalizeName(c.name).includes('wave'))

          const idleAction = idleClip ? mixer.clipAction(idleClip) : null
          const moonWalkAction = moonWalkClip ? mixer.clipAction(moonWalkClip) : null
          const waveAction = waveClip ? mixer.clipAction(waveClip) : null

          // Configure looping behavior
          ;[idleAction, moonWalkAction, waveAction].forEach((action) => {
            if (!action) return
            action.setLoop(THREE.LoopRepeat, Infinity)
            action.clampWhenFinished = false
            action.enabled = true
          })

          // Store animation actions
          animationActionsRef.current = {
            idle: idleAction,
            moonWalk: moonWalkAction,
            wave: waveAction,
            current: idleAction,
          }

          // Animation fade function
          const fadeTo = (action: THREE.AnimationAction | null, duration = 0.25) => {
            if (!action) return
            const current = animationActionsRef.current.current
            action.reset()
            action.setEffectiveTimeScale(1)
            action.setEffectiveWeight(1)
            action.play()

            if (current && current !== action) {
              current.crossFadeTo(action, duration, true)
            }
            animationActionsRef.current.current = action

            // Update current track for hover tracking
            if (action === animationActionsRef.current.moonWalk) {
              currentTrackRef.current = 'moonwalk'
            } else if (action === animationActionsRef.current.wave) {
              currentTrackRef.current = 'wave'
            } else if (action === animationActionsRef.current.idle) {
              currentTrackRef.current = 'idle'
            }
          }

          // Create animation control functions
          const playIdle = () => {
            if (idleAction) {
              fadeTo(idleAction)
              setCurrentAnimation('float')
            }
          }

          const playMoonWalk = () => {
            if (moonWalkAction) {
              fadeTo(moonWalkAction)
              setCurrentAnimation('moonWalk')
            } else {
              playIdle()
            }
          }

          const playWave = () => {
            if (waveAction) {
              fadeTo(waveAction)
              setCurrentAnimation('wave')
            } else {
              playIdle()
            }
          }

          // Update has animations state
          setHasAnimations({
            float: !!idleAction,
            moonWalk: !!moonWalkAction,
            wave: !!waveAction,
          })

          // Start with idle animation
          if (idleAction) {
            fadeTo(idleAction, 0)
            setCurrentAnimation('float')
          }

          // Store animation functions for external access
          onReadyRef.current?.({ scene, camera, model, mixer, playIdle, playMoonWalk, playWave })

          // Log animations setup
          console.log('Animations ready:', {
            idle: !!idleAction,
            moonWalk: !!moonWalkAction,
            wave: !!waveAction,
          })
        }

        // Find head for cursor following
        let headBone: THREE.Bone | null = null
        let headMesh: THREE.Mesh | null = null
        let headGroup: THREE.Group | null = null
        let neckBone: THREE.Bone | null = null

        // Search through all bones and meshes
        model.traverse((child) => {
          // Check skeleton bones
          if ((child as THREE.SkinnedMesh).isSkinnedMesh && (child as THREE.SkinnedMesh).skeleton) {
            const skinnedMesh = child as THREE.SkinnedMesh
            skinnedMesh.skeleton.bones.forEach((bone) => {
              const name = bone.name.toLowerCase()
              if (name.includes('head') && !name.includes('helmet')) {
                if (!headBone) {
                  headBone = bone
                  console.log('✓ Found head bone:', bone.name)
                }
              } else if (name.includes('neck')) {
                if (!neckBone) {
                  neckBone = bone
                  console.log('✓ Found neck bone:', bone.name)
                }
              }
            })
          }

          // Check object names (meshes, groups, etc.)
          const name = child.name.toLowerCase()
          if (name.includes('head') && !name.includes('helmet')) {
            if ((child as THREE.Group).isGroup || (child.isObject3D && child.children.length > 0)) {
              if (!headGroup) {
                headGroup = child as THREE.Group
                console.log('✓ Found head group:', child.name)
              }
            } else if ((child as THREE.Mesh).isMesh && !headMesh) {
              headMesh = child as THREE.Mesh
              console.log('✓ Found head mesh:', child.name)
            }
          }
        })

        // If we found a neck but no head, try using neck as reference
        if (!headBone && !headMesh && !headGroup && neckBone) {
          console.log('Using neck bone as head reference')
          headBone = neckBone
        }

        // Log what we found
        if (!headBone && !headMesh && !headGroup) {
          console.warn('⚠ No head found! Listing all bones and meshes:')
          model.traverse((child) => {
            if ((child as THREE.SkinnedMesh).isSkinnedMesh && (child as THREE.SkinnedMesh).skeleton) {
              const skinnedMesh = child as THREE.SkinnedMesh
              skinnedMesh.skeleton.bones.forEach((bone) => {
                console.log('  Bone:', bone.name)
              })
            }
            if (child.name) {
              console.log('  Object:', child.name, child.type)
            }
          })
        }

        // Store head reference (prefer bone, then mesh, then group)
        headRef.current = headBone || headMesh || headGroup

        // Store float offset for floating animation
        floatOffsetRef.current = model.position.y
        floatTimeRef.current = 0

        // Position camera to show astronaut on right side (1/3 of viewport)
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = camera.fov * (Math.PI / 180)
        const aspect = container.clientWidth / container.clientHeight

        // Calculate camera distance to fit model in 1/3 of viewport width
        // We want the model height to fill about 1/3 of viewport height
        const viewportHeight = container.clientHeight
        const targetHeight = viewportHeight / 2

        // Calculate distance to fit model in target height
        // Make astronaut closer (3x) - closer to camera
        const cameraDistance = ((size.y / 3 / Math.tan(fov / 2)) * (viewportHeight / targetHeight) * 1) / 3

        const cameraX = isMobile ? 0 : -cameraDistance * 0.1
        camera.position.set(cameraX, cameraDistance * 0.4, cameraDistance * 0.6)
        // Restore original behavior: aim camera immediately using the current floatOffset baseline.
        camera.lookAt(0, floatOffsetRef.current, 0)
        controls.update()

        const desktopX = size.x * 0.05
        model.position.x = desktopX
        model.position.y += 0.3
        model.scale.setScalar(isMobile ? 0.75 : 0.8)

        const mobileXNudge = 0.06
        model.position.x = isMobile ? -center.x + size.x * mobileXNudge : desktopX

        // Tilt the astronaut back a little
        model.rotation.x = -0.5 // Negative rotation tilts back

        // Update floatOffset to match the new position so floating animation works correctly
        floatOffsetRef.current = model.position.y

        // Note: we intentionally do NOT re-target the camera here (keeps original framing behavior).

        // Aim our lights at the astronaut immediately (they will keep following in the render loop)
        astronautLightTarget.position.copy(model.position)

        onReadyRef.current?.({ scene, camera, model, mixer })

        // Let one frame render with the fully-configured model, then fade in canvas + fade out loader.
        window.requestAnimationFrame(() => {
          renderer.domElement.style.opacity = '1'
          setLoaderPhase('fading')
          loaderFadeTimerRef.current = window.setTimeout(() => {
            setLoaderPhase('done')
            loaderFadeTimerRef.current = null
          }, 320)
        })
      },
      (evt) => {
        // Progress is only reliable when total is known (often 0 for compressed/streaming assets).
        const total = (evt as any)?.total
        const loaded = (evt as any)?.loaded
        if (typeof total === 'number' && total > 0 && typeof loaded === 'number') {
          const pct = Math.min(1, Math.max(0, loaded / total))
          setLoadProgress(pct)
        }
      },
      (error) => {
        console.error('Error loading model:', error)
        // Don't block the UI forever if the GLB fails; just remove loader.
        setLoaderPhase('done')
      }
    )

    /* ---------------- Animation Loop ---------------- */
    const animate = () => {
      const delta = clock.getDelta()
      mixer?.update(delta)

      // Keep helper lights aligned
      cameraLight.position.copy(camera.position)
      const model = modelRef.current
      if (model) {
        astronautLightTarget.position.copy(model.position)
      }

      // Floating and camera facing
      if (model && floatOffsetRef.current !== undefined) {
        // Float/bob animation (reduced amplitude vs boilerplate for a subtler hero feel)
        floatTimeRef.current = (floatTimeRef.current || 0) + delta * 0.8
        // Bob downward only (never above the baseline), so the astronaut doesn't drift into the top nav
        // Range: [baseline - 2*amp, baseline]
        const floatAmp = 0.05
        model.position.y = floatOffsetRef.current + (Math.sin(floatTimeRef.current) - 1) * floatAmp

        // Make astronaut face the camera (viewport) + apply user rotation from dragging
        const astronautPos = model.position.clone()
        const cameraDirection = new THREE.Vector3().subVectors(camera.position, astronautPos).normalize()

        // Rotate to face camera, then add user rotation
        const targetRotationY = Math.atan2(cameraDirection.x, cameraDirection.z) + userRotationYRef.current
        const rotationLerp = dragRef.current.active ? 1.0 : 0.2 // snappy while dragging
        model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRotationY, rotationLerp)
      }

      // Head follows mouse cursor - smooth version
      const headPart = headRef.current
      const mouse = mouseRef.current

      if (headPart && model) {
        try {
          // Calculate angles with 60 degree limit (±60 degrees from center)
          const maxAngle = (60 * Math.PI) / 180 // 60 degrees in radians = ~1.047 radians

          // Sensitivity factor - reduces how much head moves relative to cursor (0.3 = 30% sensitivity)
          const sensitivity = 0.3

          // Horizontal rotation (y-axis): based on mouse X position in viewport
          // mouse.x ranges from -1 (left) to +1 (right) in normalized device coordinates
          // When cursor is at left (mouse.x = -1) → head should look left (negative rotation)
          // When cursor is at right (mouse.x = +1) → head should look right (positive rotation)
          // When cursor is at center (mouse.x = 0) → head should look forward (rotation = 0)
          let targetY = mouse.x * maxAngle * sensitivity
          targetY = THREE.MathUtils.clamp(targetY, -maxAngle, maxAngle)

          // Vertical rotation (x-axis): based on mouse Y position in viewport
          // mouse.y ranges from -1 (bottom) to +1 (top) in normalized device coordinates
          // When cursor is at top (mouse.y = +1) → head should look up (negative x rotation)
          // When cursor is at bottom (mouse.y = -1) → head should look down (positive x rotation)
          // When cursor is at center (mouse.y = 0) → head should look forward (rotation = 0)
          let targetX = -mouse.y * maxAngle * sensitivity
          targetX = THREE.MathUtils.clamp(targetX, -maxAngle, maxAngle)

          // Fast interpolation for responsive movement without delay
          const lerpFactor = Math.min(1, delta * 12) // Fast response, no delay
          headRotationRef.current.y = THREE.MathUtils.lerp(headRotationRef.current.y, targetY, lerpFactor)
          headRotationRef.current.x = THREE.MathUtils.lerp(headRotationRef.current.x, targetX, lerpFactor)

          // Apply rotation smoothly
          if ((headPart as THREE.Bone).isBone) {
            // For bones, rotate in local space
            const bone = headPart as THREE.Bone
            bone.rotation.y = headRotationRef.current.y
            bone.rotation.x = headRotationRef.current.x
          } else {
            // For meshes/groups, rotate in local space
            if (headPart.rotation !== undefined) {
              headPart.rotation.y = headRotationRef.current.y
              headPart.rotation.x = headRotationRef.current.x
            }
          }
        } catch (error) {
          // Silently fail - head control is optional
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(animate)

    /* ---------------- Resize ---------------- */
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', onResize)

    /* ---------------- Cleanup ---------------- */
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('mousemove', onMouseMove)

      // Remove drag event listeners from canvas (desktop only)
      const canvas = renderer.domElement
      if (canvas && !isTabletOrMobile) {
        canvas.removeEventListener('pointerdown', onPointerDown)
        canvas.removeEventListener('pointermove', onPointerMove)
        canvas.removeEventListener('pointerup', onPointerUp)
        canvas.removeEventListener('pointercancel', onPointerCancel)
        canvas.removeEventListener('lostpointercapture', onPointerCancel)
        canvas.removeEventListener('contextmenu', onContextMenu)
        canvas.removeEventListener('dragstart', onDragStart)
        canvas.removeEventListener('selectstart', onSelectStart)
      }

      if (moonWalkTimerRef.current) {
        clearTimeout(moonWalkTimerRef.current)
      }
      if (loaderFadeTimerRef.current) {
        window.clearTimeout(loaderFadeTimerRef.current)
        loaderFadeTimerRef.current = null
      }
      renderer.setAnimationLoop(null)
      pmremGenerator.dispose()
      renderer.dispose()
      container.innerHTML = ''
    }
  }, [modelUrl]) // Removed onReady from dependencies to prevent re-renders

  const handleAnimationClick = (animation: 'float' | 'moonWalk' | 'wave') => {
    // Track GTM / GA4 click event
    try {
      if (typeof window !== 'undefined') {
        const env = (window as any).__NEXT_APP_ENV__ || 'prod'
        let trackingId: string | undefined
        try {
          const raw = window.localStorage?.getItem('hypernova_tracking')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed.tracking_id === 'string') {
              trackingId = parsed.tracking_id
            }
          }
        } catch {
          // ignore localStorage / JSON issues
        }

        ;(window as any).dataLayer?.push?.({
          event: 'astronaut_animation_click',
          app_env: env,
          tracking_id: trackingId,
          animation,
        })
      }
    } catch {
      // never block animation on tracking
    }

    const actions = animationActionsRef.current

    const fadeTo = (action: THREE.AnimationAction | null, duration = 0.25) => {
      if (!action) return
      const current = actions.current
      action.reset()
      action.setEffectiveTimeScale(1)
      action.setEffectiveWeight(1)
      action.play()

      if (current && current !== action) {
        current.crossFadeTo(action, duration, true)
      }
      actions.current = action
    }

    if (animation === 'float' && actions.idle) {
      fadeTo(actions.idle)
      setCurrentAnimation('float')
      currentTrackRef.current = 'idle'
    } else if (animation === 'moonWalk' && actions.moonWalk) {
      fadeTo(actions.moonWalk)
      setCurrentAnimation('moonWalk')
      currentTrackRef.current = 'moonwalk'
    } else if (animation === 'wave' && actions.wave) {
      fadeTo(actions.wave)
      setCurrentAnimation('wave')
      currentTrackRef.current = 'wave'
    }
  }

  const controlsEl = useMemo(() => {
    if (!showControls || !isClient || !controlsPos.visible) return null
    return (
      <div
        style={{
          position: 'fixed',
          left: `${controlsPos.left}px`,
          top: `${controlsPos.top}px`,
          transform: 'translate(-100%, -100%)',
          pointerEvents: 'auto',
        }}
        className='astronaut-anim-controls'
        role='group'
        aria-label='Astronaut animations'>
        <button
          type='button'
          onClick={() => handleAnimationClick('float')}
          disabled={!hasAnimations.float}
          aria-pressed={currentAnimation === 'float'}
          className={`astronaut-anim-btn${currentAnimation === 'float' ? ' is-active' : ''}`}>
          Float
        </button>

        <button
          type='button'
          onClick={() => handleAnimationClick('moonWalk')}
          disabled={!hasAnimations.moonWalk}
          aria-pressed={currentAnimation === 'moonWalk'}
          className={`astronaut-anim-btn${currentAnimation === 'moonWalk' ? ' is-active' : ''}`}>
          Moon Walk
        </button>

        <button
          type='button'
          onClick={() => handleAnimationClick('wave')}
          disabled={!hasAnimations.wave}
          aria-pressed={currentAnimation === 'wave'}
          className={`astronaut-anim-btn${currentAnimation === 'wave' ? ' is-active' : ''}`}>
          Wave
        </button>
      </div>
    )
  }, [
    showControls,
    isClient,
    controlsPos.left,
    controlsPos.top,
    controlsPos.visible,
    currentAnimation,
    hasAnimations,
    handleAnimationClick,
  ])

  return (
    <>
      <div
        className={styles.wrapper}
        style={{
          width: '100%',
          // Keep some spillover for the legs, but reduce overlap into the next section
          height: isMobile ? '100%' : isTablet ? '110%' : '150%',
          minHeight: isMobile ? '0' : isTablet ? '600px' : '800px',
          overflow: 'visible',
          position: 'relative',
          zIndex: 999,
          // Bottom fade only
          WebkitMaskImage: isMobile ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
          maskImage: isMobile ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
          // Desktop: capture pointer events for dragging; Mobile: let clicks pass through
          pointerEvents: isTablet ? 'none' : 'auto',
          isolation: 'isolate',
          // Desktop only - disable selection and prevent scroll during drag
          userSelect: isTablet ? 'auto' : 'none',
          WebkitUserSelect: isTablet ? 'auto' : 'none',
          touchAction: isTablet ? 'pan-y' : 'none',
        }}>
        <div
          ref={containerRef}
          className='three-astronaut-root'
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
            position: 'relative',
          }}
        />

        {loaderPhase !== 'done' ? (
          <div
            className={`${styles.loaderOverlay}${loaderPhase === 'fading' ? ` ${styles.isFading}` : ''}`}
            role='status'
            aria-label='Loading 3D astronaut'>
            <div className={styles.loaderCard}>
              <div className={styles.orbit} aria-hidden='true'>
                <div className={styles.orbitCore} />
                <div className={styles.orbitSatellite} />
              </div>

              <div className={styles.loaderText}>
                <div className={styles.loaderTitle}>Loading interactive astronaut…</div>
                <div className={styles.loaderSubtitle}>Calibrating EVA systems &amp; altitude control…</div>
                {typeof loadProgress === 'number' ? (
                  <div className={styles.progressBar} aria-hidden='true'>
                    <div className={styles.progressFill} style={{ width: `${Math.round(loadProgress * 100)}%` }} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {isClient && controlsEl ? createPortal(controlsEl, document.body) : null}
    </>
  )
}
