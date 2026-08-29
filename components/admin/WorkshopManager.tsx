// components/admin/WorkshopManager.tsx

'use client'

import {
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import {
  Calendar,
  Plus,
  X,
  Upload,
  Loader2,
  Trash2,
  Copy,
  ShieldCheck,
  Eye,
  EyeOff,
  Image as ImageIcon,
  PenTool,
  ListChecks,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface Speaker {
  _id?: string

  name: string

  title: string

  institution: string

  sessionTitle: string

  description: string

  points: string[]

  isConvener: boolean
}

interface CertBatch {
  _id: string

  title: string

  code: string

  logoUrl: string

  signatureUrl: string

  convenerName: string

  certificateOutcomes: string[]

  isActive: boolean

  issuedCount: number

  createdAt: string
}

// ============================================================
// COMPONENT
// ============================================================

export default function WorkshopManager() {
  // ----------------------------------------------------------
  // Workshop content
  // ----------------------------------------------------------

  const [
    heading,
    setHeading,
  ] = useState('')

  const [
    subheading,
    setSubheading,
  ] = useState('')

  const [
    speakers,
    setSpeakers,
  ] = useState<Speaker[]>([])

  const [
    advertImages,
    setAdvertImages,
  ] = useState<string[]>([])

  const [
    discordLink,
    setDiscordLink,
  ] = useState('')

  const [
    uploadingAd,
    setUploadingAd,
  ] = useState(false)

  const [
    savingContent,
    setSavingContent,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)

  // ----------------------------------------------------------
  // Certificates
  // ----------------------------------------------------------

  const [
    batches,
    setBatches,
  ] = useState<CertBatch[]>([])

  const [
    showCertForm,
    setShowCertForm,
  ] = useState(false)

  const [
    certTitle,
    setCertTitle,
  ] = useState('')

  const [
    convenerName,
    setConvenerName,
  ] = useState(
    'Okeke Daniel'
  )

  /**
   * Admin enters one certificate outcome per line.
   */
  const [
    certificateOutcomesText,
    setCertificateOutcomesText,
  ] = useState('')

  const [
    logoUrl,
    setLogoUrl,
  ] = useState<
    string | null
  >(null)

  const [
    signatureUrl,
    setSignatureUrl,
  ] = useState<
    string | null
  >(null)

  const [
    uploadingLogo,
    setUploadingLogo,
  ] = useState(false)

  const [
    uploadingSig,
    setUploadingSig,
  ] = useState(false)

  const [
    creatingBatch,
    setCreatingBatch,
  ] = useState(false)

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadContent =
    async () => {
      try {
        const response =
          await fetch(
            '/api/admin/workshop',
            {
              cache: 'no-store',
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to load workshop content'
          )
        }

        if (data.content) {
          setHeading(
            data.content.heading ||
              ''
          )

          setSubheading(
            data.content
              .subheading || ''
          )

          setSpeakers(
            data.content
              .speakers || []
          )

          setAdvertImages(
            data.content
              .advertImages || []
          )

          setDiscordLink(
            data.content
              .discordInviteLink ||
              ''
          )
        }
      } catch (error) {
        console.error(
          error
        )

        toast.error(
          'Failed to load workshop content'
        )
      }
    }

  const loadBatches =
    async () => {
      try {
        const response =
          await fetch(
            '/api/admin/workshop/certificates',
            {
              cache: 'no-store',
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to load certificates'
          )
        }

        setBatches(
          data.batches || []
        )
      } catch (error) {
        console.error(
          error
        )

        toast.error(
          'Failed to load certificate batches'
        )
      }
    }

  useEffect(() => {
    Promise.all([
      loadContent(),
      loadBatches(),
    ]).finally(() =>
      setLoading(false)
    )
  }, [])

  // ==========================================================
  // SPEAKERS
  // ==========================================================

  const updateSpeaker = (
    index: number,
    field: keyof Speaker,
    value: any
  ) => {
    setSpeakers(
      (current) =>
        current.map(
          (
            speaker,
            speakerIndex
          ) =>
            speakerIndex ===
            index
              ? {
                  ...speaker,
                  [field]:
                    value,
                }
              : speaker
        )
    )
  }

  const updatePoint = (
    speakerIndex: number,
    pointIndex: number,
    value: string
  ) => {
    setSpeakers(
      (current) =>
        current.map(
          (
            speaker,
            index
          ) => {
            if (
              index !==
              speakerIndex
            ) {
              return speaker
            }

            const points = [
              ...speaker.points,
            ]

            points[
              pointIndex
            ] = value

            return {
              ...speaker,
              points,
            }
          }
        )
    )
  }

  const addPoint = (
    speakerIndex: number
  ) => {
    setSpeakers(
      (current) =>
        current.map(
          (
            speaker,
            index
          ) =>
            index ===
            speakerIndex
              ? {
                  ...speaker,

                  points: [
                    ...speaker.points,
                    '',
                  ],
                }
              : speaker
        )
    )
  }

  const removePoint = (
    speakerIndex: number,
    pointIndex: number
  ) => {
    setSpeakers(
      (current) =>
        current.map(
          (
            speaker,
            index
          ) =>
            index ===
            speakerIndex
              ? {
                  ...speaker,

                  points:
                    speaker.points.filter(
                      (
                        _,
                        index
                      ) =>
                        index !==
                        pointIndex
                    ),
                }
              : speaker
        )
    )
  }

  const addSpeaker =
    () => {
      setSpeakers(
        (
          current
        ) => [
          ...current,

          {
            name: '',

            title: '',

            institution:
              '',

            sessionTitle:
              '',

            description:
              '',

            points: [''],

            isConvener:
              false,
          },
        ]
      )
    }

  const removeSpeaker = (
    index: number
  ) => {
    setSpeakers(
      (current) =>
        current.filter(
          (
            _,
            speakerIndex
          ) =>
            speakerIndex !==
            index
        )
    )
  }

  // ==========================================================
  // WORKSHOP IMAGE UPLOAD
  // ==========================================================

  const uploadAdImage =
    async (
      file: File
    ) => {
      setUploadingAd(true)

      try {
        const formData =
          new FormData()

        formData.append(
          'file',
          file
        )

        formData.append(
          'type',
          'image'
        )

        const response =
          await fetch(
            '/api/upload',
            {
              method:
                'POST',

              body:
                formData,
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          toast.error(
            data.error ||
              'Upload failed'
          )

          return
        }

        setAdvertImages(
          (
            current
          ) => [
            ...current,
            data.url,
          ]
        )
      } catch {
        toast.error(
          'Upload failed'
        )
      } finally {
        setUploadingAd(
          false
        )
      }
    }

  // ==========================================================
  // SAVE WORKSHOP CONTENT
  // ==========================================================

  const saveContent =
    async () => {
      setSavingContent(
        true
      )

      try {
        const response =
          await fetch(
            '/api/admin/workshop',
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    heading,

                    subheading,

                    speakers,

                    advertImages,

                    discordInviteLink:
                      discordLink,
                  }
                ),
            }
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          toast.error(
            data.error ||
              'Failed to save'
          )

          return
        }

        toast.success(
          'Workshop page updated'
        )
      } catch {
        toast.error(
          'Failed to save workshop page'
        )
      } finally {
        setSavingContent(
          false
        )
      }
    }

  // ==========================================================
  // CERTIFICATE ASSET UPLOAD
  // ==========================================================

  const uploadCertAsset =
    async (
      file: File,
      field:
        | 'logo'
        | 'signature'
    ) => {
      if (
        field === 'logo'
      ) {
        setUploadingLogo(
          true
        )
      }

      if (
        field ===
        'signature'
      ) {
        setUploadingSig(
          true
        )
      }

      try {
        const formData =
          new FormData()

        formData.append(
          'file',
          file
        )

        formData.append(
          'type',
          'image'
        )

        const response =
          await fetch(
            '/api/upload',
            {
              method:
                'POST',

              body:
                formData,
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          toast.error(
            data.error ||
              'Upload failed'
          )

          return
        }

        if (
          field === 'logo'
        ) {
          setLogoUrl(
            data.url
          )
        }

        if (
          field ===
          'signature'
        ) {
          setSignatureUrl(
            data.url
          )
        }
      } catch {
        toast.error(
          'Upload failed'
        )
      } finally {
        if (
          field === 'logo'
        ) {
          setUploadingLogo(
            false
          )
        }

        if (
          field ===
          'signature'
        ) {
          setUploadingSig(
            false
          )
        }
      }
    }

  // ==========================================================
  // CREATE CERTIFICATE BATCH
  // ==========================================================

  const createBatch =
    async () => {
      if (
        !certTitle.trim()
      ) {
        toast.error(
          'Workshop title is required'
        )

        return
      }

      if (!logoUrl) {
        toast.error(
          'Certificate logo is required'
        )

        return
      }

      if (
        !signatureUrl
      ) {
        toast.error(
          'Signature is required'
        )

        return
      }

      const certificateOutcomes =
        certificateOutcomesText
          .split('\n')
          .map((item) =>
            item.trim()
          )
          .filter(Boolean)

      setCreatingBatch(
        true
      )

      try {
        const response =
          await fetch(
            '/api/admin/workshop/certificates',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    title:
                      certTitle.trim(),

                    logoUrl,

                    signatureUrl,

                    convenerName:
                      convenerName.trim(),

                    certificateOutcomes,
                  }
                ),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          toast.error(
            data.error ||
              'Failed to create certificate'
          )

          return
        }

        toast.success(
          `Code generated: ${data.batch.code}`
        )

        setCertTitle(
          ''
        )

        setCertificateOutcomesText(
          ''
        )

        setLogoUrl(
          null
        )

        setSignatureUrl(
          null
        )

        setShowCertForm(
          false
        )

        await loadBatches()
      } catch {
        toast.error(
          'Failed to create certificate'
        )
      } finally {
        setCreatingBatch(
          false
        )
      }
    }

  // ==========================================================
  // TOGGLE
  // ==========================================================

  const toggleBatch =
    async (
      batch: CertBatch
    ) => {
      try {
        const response =
          await fetch(
            `/api/admin/workshop/certificates/${batch._id}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    isActive:
                      !batch.isActive,
                  }
                ),
            }
          )

        if (!response.ok) {
          toast.error(
            'Failed to update certificate'
          )

          return
        }

        await loadBatches()
      } catch {
        toast.error(
          'Failed to update certificate'
        )
      }
    }

  // ==========================================================
  // DELETE
  // ==========================================================

  const deleteBatch =
    async (
      batch: CertBatch
    ) => {
      const confirmed =
        window.confirm(
          `Delete certificate batch "${batch.title}"? Its code will stop working.`
        )

      if (!confirmed) {
        return
      }

      try {
        const response =
          await fetch(
            `/api/admin/workshop/certificates/${batch._id}`,
            {
              method:
                'DELETE',
            }
          )

        if (!response.ok) {
          toast.error(
            'Failed to delete certificate'
          )

          return
        }

        toast.success(
          'Certificate batch deleted'
        )

        await loadBatches()
      } catch {
        toast.error(
          'Failed to delete certificate'
        )
      }
    }

  // ==========================================================
  // COPY CODE
  // ==========================================================

  const copyCode =
    async (
      code: string
    ) => {
      await navigator.clipboard.writeText(
        code
      )

      toast.success(
        'Code copied'
      )
    }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-4">

      {/* =====================================================
          WORKSHOP PAGE CONTENT
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-gray-100 p-5">

        <div className="flex items-center gap-2 mb-1">
          <Calendar
            size={18}
            className="text-red-600"
          />

          <h2 className="text-base font-semibold text-gray-900">
            Workshop Page Content
          </h2>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Edits reflect immediately on the public /workshop page.
        </p>

        <div className="space-y-3">

          <input
            value={
              heading
            }
            onChange={(
              e
            ) =>
              setHeading(
                e.target.value
              )
            }
            placeholder="Heading"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          <input
            value={
              subheading
            }
            onChange={(
              e
            ) =>
              setSubheading(
                e.target.value
              )
            }
            placeholder="Subheading / topic"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          <input
            value={
              discordLink
            }
            onChange={(
              e
            ) =>
              setDiscordLink(
                e.target.value
              )
            }
            placeholder="Discord invite link"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          {/* Hero images */}
          <div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Hero Slider Images
            </label>

            <div className="flex flex-wrap gap-2 mb-2">

              {advertImages.map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={
                      `${image}-${index}`
                    }
                    className="relative w-16 h-16"
                  >
                    <img
                      src={
                        image
                      }
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setAdvertImages(
                          (
                            current
                          ) =>
                            current.filter(
                              (
                                _,
                                imageIndex
                              ) =>
                                imageIndex !==
                                index
                            )
                        )
                      }
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X
                        size={
                          11
                        }
                        className="text-white"
                      />
                    </button>
                  </div>
                )
              )}

            </div>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">

              {uploadingAd ? (
                <Loader2
                  size={
                    13
                  }
                  className="animate-spin"
                />
              ) : (
                <ImageIcon
                  size={
                    13
                  }
                />
              )}

              Add Image

              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={
                  uploadingAd
                }
                onChange={(
                  e
                ) => {
                  const file =
                    e.target
                      .files?.[0]

                  if (file) {
                    uploadAdImage(
                      file
                    )
                  }

                  e.target.value =
                    ''
                }}
              />
            </label>

            <p className="text-[11px] text-gray-400 mt-1">
              Multiple images auto-rotate as a slider in the page hero.
            </p>

          </div>

          {/* Speakers */}
          <div>

            <div className="flex items-center justify-between mb-2">

              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Speakers
              </label>

              <button
                type="button"
                onClick={
                  addSpeaker
                }
                className="flex items-center gap-1 text-xs font-semibold text-red-600"
              >
                <Plus
                  size={
                    12
                  }
                />

                Add Speaker
              </button>

            </div>

            <div className="space-y-3">

              {speakers.map(
                (
                  speaker,
                  speakerIndex
                ) => (
                  <div
                    key={
                      speaker._id ||
                      speakerIndex
                    }
                    className="border border-gray-100 rounded-xl p-3 space-y-2"
                  >

                    <div className="flex justify-between gap-2">

                      <input
                        value={
                          speaker.name
                        }
                        onChange={(
                          e
                        ) =>
                          updateSpeaker(
                            speakerIndex,
                            'name',
                            e.target.value
                          )
                        }
                        placeholder="Speaker name"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />

                      <label className="flex items-center gap-1 text-[11px] text-gray-500 shrink-0">

                        <input
                          type="checkbox"
                          checked={
                            speaker.isConvener
                          }
                          onChange={(
                            e
                          ) =>
                            updateSpeaker(
                              speakerIndex,
                              'isConvener',
                              e.target.checked
                            )
                          }
                        />

                        Convener

                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          removeSpeaker(
                            speakerIndex
                          )
                        }
                      >
                        <X
                          size={
                            15
                          }
                          className="text-gray-400 hover:text-red-500"
                        />
                      </button>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                      <input
                        value={
                          speaker.title
                        }
                        onChange={(
                          e
                        ) =>
                          updateSpeaker(
                            speakerIndex,
                            'title',
                            e.target.value
                          )
                        }
                        placeholder="Role/title"
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />

                      <input
                        value={
                          speaker.institution
                        }
                        onChange={(
                          e
                        ) =>
                          updateSpeaker(
                            speakerIndex,
                            'institution',
                            e.target.value
                          )
                        }
                        placeholder="Institution / organization"
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />

                    </div>

                    <input
                      value={
                        speaker.sessionTitle
                      }
                      onChange={(
                        e
                      ) =>
                        updateSpeaker(
                          speakerIndex,
                          'sessionTitle',
                          e.target.value
                        )
                      }
                      placeholder="Session title"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />

                    <input
                      value={
                        speaker.description
                      }
                      onChange={(
                        e
                      ) =>
                        updateSpeaker(
                          speakerIndex,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="Description / talk title"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />

                    <div className="space-y-1">

                      {speaker.points.map(
                        (
                          point,
                          pointIndex
                        ) => (
                          <div
                            key={
                              pointIndex
                            }
                            className="flex gap-1.5"
                          >

                            <input
                              value={
                                point
                              }
                              onChange={(
                                e
                              ) =>
                                updatePoint(
                                  speakerIndex,
                                  pointIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Point ${
                                pointIndex +
                                1
                              }`}
                              className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removePoint(
                                  speakerIndex,
                                  pointIndex
                                )
                              }
                            >
                              <X
                                size={
                                  13
                                }
                                className="text-gray-400"
                              />
                            </button>

                          </div>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          addPoint(
                            speakerIndex
                          )
                        }
                        className="text-[11px] font-semibold text-red-600 flex items-center gap-1"
                      >
                        <Plus
                          size={
                            10
                          }
                        />

                        Add point
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

          <button
            type="button"
            onClick={
              saveContent
            }
            disabled={
              savingContent
            }
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {savingContent && (
              <Loader2
                size={
                  14
                }
                className="animate-spin"
              />
            )}

            Save Content
          </button>

        </div>

      </div>

      {/* =====================================================
          CERTIFICATE BATCHES
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-gray-100 p-5">

        <div className="flex items-center justify-between mb-1">

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={
                18
              }
              className="text-red-600"
            />

            <h2 className="text-base font-semibold text-gray-900">
              Participation Certificates
            </h2>

          </div>

          {!showCertForm && (
            <button
              type="button"
              onClick={() =>
                setShowCertForm(
                  true
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
            >
              <Plus
                size={
                  13
                }
              />

              New Certificate
            </button>
          )}

        </div>

        <p className="text-sm text-gray-500 mb-4">
          Create certificate batches and add the learning outcomes that should appear on each certificate.
        </p>

        {/* Certificate form */}
        {showCertForm && (
          <div className="border-2 border-red-100 rounded-xl p-4 space-y-4 mb-4">

            <div>

              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Workshop / Event Title
              </label>

              <input
                value={
                  certTitle
                }
                onChange={(
                  e
                ) =>
                  setCertTitle(
                    e.target.value
                  )
                }
                placeholder="e.g. Becoming an Effective Online Tutor"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />

            </div>

            <div>

              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Convener Name
              </label>

              <input
                value={
                  convenerName
                }
                onChange={(
                  e
                ) =>
                  setConvenerName(
                    e.target.value
                  )
                }
                placeholder="Convener name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />

            </div>

            {/* Outcomes */}
            <div>

              <div className="flex items-center gap-1.5 mb-1.5">

                <ListChecks
                  size={
                    14
                  }
                  className="text-red-600"
                />

                <label className="text-xs font-semibold text-gray-600">
                  Certificate Outcomes
                </label>

              </div>

              <textarea
                value={
                  certificateOutcomesText
                }
                onChange={(
                  e
                ) =>
                  setCertificateOutcomesText(
                    e.target.value
                  )
                }
                rows={5}
                placeholder={`Enter one outcome per line, for example:\nUnderstand the fundamentals of effective online tutoring\nApply learner engagement techniques\nUse digital teaching tools effectively`}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y"
              />

              <p className="text-[11px] text-gray-400 mt-1">
                Enter one outcome per line. These outcomes will be printed on every certificate in this batch.
              </p>

            </div>

            {/* Only logo + signature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Logo */}
              <div>

                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  Certificate Logo
                </p>

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center min-h-[130px] flex flex-col items-center justify-center">

                  {logoUrl ? (
                    <img
                      src={
                        logoUrl
                      }
                      alt="Certificate logo"
                      className="h-16 max-w-full object-contain mb-2"
                    />
                  ) : (
                    <Upload className="w-7 h-7 text-gray-300 mb-2" />
                  )}

                  <label className="text-xs font-semibold text-red-600 cursor-pointer">

                    {uploadingLogo
                      ? 'Uploading...'
                      : logoUrl
                      ? 'Replace Logo'
                      : 'Upload Logo'}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={
                        uploadingLogo
                      }
                      onChange={(
                        e
                      ) => {
                        const file =
                          e.target
                            .files?.[0]

                        if (
                          file
                        ) {
                          uploadCertAsset(
                            file,
                            'logo'
                          )
                        }

                        e.target.value =
                          ''
                      }}
                    />

                  </label>

                </div>

              </div>

              {/* Signature */}
              <div>

                <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">

                  <PenTool
                    size={
                      11
                    }
                  />

                  Convener Signature

                </p>

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center min-h-[130px] flex flex-col items-center justify-center">

                  {signatureUrl ? (
                    <img
                      src={
                        signatureUrl
                      }
                      alt="Convener signature"
                      className="h-16 max-w-full object-contain mb-2"
                    />
                  ) : (
                    <Upload className="w-7 h-7 text-gray-300 mb-2" />
                  )}

                  <label className="text-xs font-semibold text-red-600 cursor-pointer">

                    {uploadingSig
                      ? 'Uploading...'
                      : signatureUrl
                      ? 'Replace Signature'
                      : 'Upload Signature'}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={
                        uploadingSig
                      }
                      onChange={(
                        e
                      ) => {
                        const file =
                          e.target
                            .files?.[0]

                        if (
                          file
                        ) {
                          uploadCertAsset(
                            file,
                            'signature'
                          )
                        }

                        e.target.value =
                          ''
                      }}
                    />

                  </label>

                </div>

              </div>

            </div>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={() => {
                  setShowCertForm(
                    false
                  )

                  setCertTitle(
                    ''
                  )

                  setCertificateOutcomesText(
                    ''
                  )

                  setLogoUrl(
                    null
                  )

                  setSignatureUrl(
                    null
                  )
                }}
                disabled={
                  creatingBatch
                }
                className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  createBatch
                }
                disabled={
                  creatingBatch
                }
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >

                {creatingBatch && (
                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                )}

                Generate Code

              </button>

            </div>

          </div>
        )}

        {/* Existing batches */}
        <div className="space-y-2.5">

          {batches.length ===
            0 && (
            <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center">

              <ShieldCheck className="w-7 h-7 text-gray-300 mx-auto mb-2" />

              <p className="text-sm text-gray-500">
                No certificate batches created yet.
              </p>

            </div>
          )}

          {batches.map(
            (
              batch
            ) => (
              <div
                key={
                  batch._id
                }
                className="border border-gray-100 rounded-xl p-3 flex items-start gap-3"
              >

                {/* Logo replaces old theme thumbnail */}
                <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">

                  {batch.logoUrl ? (
                    <img
                      src={
                        batch.logoUrl
                      }
                      alt=""
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-gray-300" />
                  )}

                </div>

                <div className="flex-1 min-w-0">

                  <p className="text-sm font-semibold text-gray-900">
                    {
                      batch.title
                    }
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      copyCode(
                        batch.code
                      )
                    }
                    className="flex items-center gap-1.5 text-xs font-mono text-red-600 mt-0.5"
                  >
                    {
                      batch.code
                    }

                    <Copy
                      size={
                        11
                      }
                    />
                  </button>

                  <p className="text-[11px] text-gray-400 mt-1">
                    {
                      batch.issuedCount
                    }{' '}
                    certificate
                    {batch.issuedCount !==
                    1
                      ? 's'
                      : ''}{' '}
                    issued · signed by{' '}
                    {
                      batch.convenerName
                    }
                  </p>

                  {batch.certificateOutcomes?.length >
                    0 && (
                    <div className="mt-2">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                        Outcomes
                      </p>

                      <div className="space-y-0.5">

                        {batch.certificateOutcomes
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (
                              outcome,
                              index
                            ) => (
                              <p
                                key={
                                  index
                                }
                                className="text-[11px] text-gray-500 truncate"
                              >
                                •{' '}
                                {
                                  outcome
                                }
                              </p>
                            )
                          )}

                        {batch
                          .certificateOutcomes
                          .length >
                          3 && (
                          <p className="text-[10px] text-gray-400">
                            +
                            {batch
                              .certificateOutcomes
                              .length -
                              3}{' '}
                            more
                          </p>
                        )}

                      </div>

                    </div>
                  )}

                </div>

                <button
                  type="button"
                  title={
                    batch.isActive
                      ? 'Deactivate'
                      : 'Activate'
                  }
                  onClick={() =>
                    toggleBatch(
                      batch
                    )
                  }
                  className={`p-2 rounded-lg shrink-0 ${
                    batch.isActive
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {batch.isActive ? (
                    <Eye
                      size={
                        15
                      }
                    />
                  ) : (
                    <EyeOff
                      size={
                        15
                      }
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteBatch(
                      batch
                    )
                  }
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                >
                  <Trash2
                    size={
                      15
                    }
                  />
                </button>

              </div>
            )
          )}

        </div>

      </div>

    </div>
  )
}