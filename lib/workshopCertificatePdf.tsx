// lib/workshopCertificatePdf.tsx

import React from 'react'

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  navy: '#122C4A',
  gold: '#B8860B',
  goldLight: '#D8B75E',
  text: '#2D3748',
  muted: '#667085',
  border: '#D6B75C',
  lightGold: '#FFF9E8',
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    page: {
      position: 'relative',

      fontFamily:
        'Times-Roman',

      backgroundColor:
        '#FFFFFF',

      padding: 32,
    },

    // --------------------------------------------------------
    // Decorative borders
    // --------------------------------------------------------

    outerBorder: {
      position:
        'absolute',

      top: 18,
      bottom: 18,
      left: 18,
      right: 18,

      borderWidth: 3,
      borderColor:
        COLORS.gold,
    },

    innerBorder: {
      position:
        'absolute',

      top: 26,
      bottom: 26,
      left: 26,
      right: 26,

      borderWidth: 1,
      borderColor:
        COLORS.goldLight,
    },

    content: {
      position:
        'relative',

      width: '100%',
      height: '100%',

      paddingTop: 8,
      paddingBottom: 4,
      paddingHorizontal: 30,

      alignItems:
        'center',
    },

    // --------------------------------------------------------
    // Header / logo
    // --------------------------------------------------------

    logoWrapper: {
      height: 55,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginBottom: 2,
    },

    logo: {
      width: 52,
      height: 52,

      objectFit:
        'contain',
    },

    organizationName: {
      fontFamily:
        'Times-Bold',

      fontSize: 12,

      letterSpacing: 1.5,

      color:
        COLORS.navy,

      marginTop: 2,
      marginBottom: 7,
    },

    certificateTitle: {
      fontFamily:
        'Times-Bold',

      fontSize: 25,

      letterSpacing: 3.2,

      color:
        COLORS.gold,

      marginBottom: 8,

      textAlign:
        'center',
    },

    certificateSubtitle: {
      fontSize: 12,

      color:
        COLORS.muted,

      marginBottom: 6,

      textAlign:
        'center',
    },

    // --------------------------------------------------------
    // Recipient
    // --------------------------------------------------------

    recipientName: {
      fontFamily:
        'Times-BoldItalic',

      fontSize: 30,

      color:
        COLORS.navy,

      textAlign:
        'center',

      marginTop: 2,
      marginBottom: 6,

      paddingBottom: 5,

      paddingHorizontal: 32,

      borderBottomWidth: 1.4,
      borderBottomColor:
        COLORS.gold,
    },

    participationText: {
      fontSize: 12.5,

      color:
        COLORS.text,

      lineHeight: 1.5,

      marginTop: 4,

      marginBottom: 4,

      textAlign:
        'center',
    },

    workshopTitle: {
      fontFamily:
        'Times-Bold',

      fontSize: 18,

      lineHeight: 1.25,

      color:
        COLORS.navy,

      textAlign:
        'center',

      marginTop: 2,
      marginBottom: 8,

      maxWidth: 630,
    },

    // --------------------------------------------------------
    // Outcomes
    // --------------------------------------------------------

    outcomesContainer: {
      width: '84%',

      backgroundColor:
        COLORS.lightGold,

      borderWidth: 0.7,
      borderColor:
        '#E8D7A6',

      paddingVertical: 8,
      paddingHorizontal: 16,

      marginTop: 2,
      marginBottom: 10,
    },

    outcomesHeading: {
      fontFamily:
        'Times-Bold',

      color:
        COLORS.gold,

      fontSize: 9.5,

      letterSpacing: 1.3,

      marginBottom: 4,

      textAlign:
        'center',
    },

    outcomeRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      marginBottom: 2,
    },

    outcomeBullet: {
      width: 11,

      fontSize: 9,

      color:
        COLORS.gold,
    },

    outcomeText: {
      flex: 1,

      fontSize: 9.3,

      lineHeight: 1.25,

      color:
        COLORS.text,
    },

    // --------------------------------------------------------
    // Bottom area
    // --------------------------------------------------------

    footerArea: {
      position:
        'absolute',

      left: 58,
      right: 58,
      bottom: 42,

      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-end',
    },

    // --------------------------------------------------------
    // Signature LEFT
    // --------------------------------------------------------

    signatureBlock: {
      width: 210,

      alignItems:
        'flex-start',
    },

    signatureImageWrapper: {
      width: 150,

      height: 42,

      alignItems:
        'flex-start',

      justifyContent:
        'flex-end',
    },

    signatureImage: {
      width: 110,
      height: 40,

      objectFit:
        'contain',
    },

    signatureLine: {
      width: 160,

      borderTopWidth: 1,
      borderTopColor:
        '#666666',

      paddingTop: 4,
    },

    signatureName: {
      fontFamily:
        'Times-Bold',

      fontSize: 10,

      color:
        COLORS.navy,
    },

    signatureRole: {
      fontSize: 8,

      color:
        COLORS.muted,

      marginTop: 1,
    },

    // --------------------------------------------------------
    // Certificate details RIGHT
    // --------------------------------------------------------

    detailsBlock: {
      width: 230,

      alignItems:
        'flex-end',
    },

    detailsLabel: {
      fontFamily:
        'Times-Bold',

      fontSize: 7.5,

      color:
        COLORS.muted,

      marginBottom: 1,
    },

    detailsValue: {
      fontSize: 9,

      color:
        COLORS.navy,

      marginBottom: 5,
    },

    // --------------------------------------------------------
    // Footer
    // --------------------------------------------------------

    footerText: {
      position:
        'absolute',

      bottom: 27,
      left: 0,
      right: 0,

      textAlign:
        'center',

      fontSize: 6.8,

      color:
        '#9CA3AF',

      letterSpacing: 0.5,
    },
  })

// ============================================================
// TYPES
// ============================================================

export interface WorkshopCertificateProps {
  fullName: string

  workshopTitle: string

  certificateOutcomes?: string[]

  logoUrl?: string

  signatureUrl?: string

  convenerName: string

  certificateNumber: string

  issuedAt: Date
}

// ============================================================
// CERTIFICATE DOCUMENT
// ============================================================

function WorkshopCertDoc({
  fullName,
  workshopTitle,
  certificateOutcomes = [],
  logoUrl,
  signatureUrl,
  convenerName,
  certificateNumber,
  issuedAt,
}: WorkshopCertificateProps) {
  const dateStr =
    issuedAt.toLocaleDateString(
      'en-NG',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    )

  const cleanOutcomes =
    certificateOutcomes
      .map((item) =>
        item.trim()
      )
      .filter(Boolean)

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
      >
        {/* Decorative border */}
        <View
          style={
            styles.outerBorder
          }
        />

        <View
          style={
            styles.innerBorder
          }
        />

        <View
          style={
            styles.content
          }
        >
          {/* Logo */}
          {logoUrl && (
            <View
              style={
                styles.logoWrapper
              }
            >
              <Image
                src={logoUrl}
                style={
                  styles.logo
                }
              />
            </View>
          )}

          <Text
            style={
              styles.organizationName
            }
          >
            LORAN EDUHUB
          </Text>

          <Text
            style={
              styles.certificateTitle
            }
          >
            CERTIFICATE OF PARTICIPATION
          </Text>

          <Text
            style={
              styles.certificateSubtitle
            }
          >
            This certificate is proudly presented to
          </Text>

          <Text
            style={
              styles.recipientName
            }
          >
            {fullName}
          </Text>

          <Text
            style={
              styles.participationText
            }
          >
            for successfully participating in the workshop
          </Text>

          <Text
            style={
              styles.workshopTitle
            }
          >
            {workshopTitle}
          </Text>

          {cleanOutcomes.length >
            0 && (
            <View
              style={
                styles.outcomesContainer
              }
            >
              <Text
                style={
                  styles.outcomesHeading
                }
              >
                WORKSHOP OUTCOMES
              </Text>

              {cleanOutcomes.map(
                (
                  outcome,
                  index
                ) => (
                  <View
                    key={`${index}-${outcome}`}
                    style={
                      styles.outcomeRow
                    }
                  >
                    <Text
                      style={
                        styles.outcomeBullet
                      }
                    >
                      •
                    </Text>

                    <Text
                      style={
                        styles.outcomeText
                      }
                    >
                      {
                        outcome
                      }
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {/* Bottom */}
          <View
            style={
              styles.footerArea
            }
          >
            {/* LEFT SIGNATURE */}
            <View
              style={
                styles.signatureBlock
              }
            >
              {signatureUrl && (
                <View
                  style={
                    styles.signatureImageWrapper
                  }
                >
                  <Image
                    src={
                      signatureUrl
                    }
                    style={
                      styles.signatureImage
                    }
                  />
                </View>
              )}

              <View
                style={
                  styles.signatureLine
                }
              >
                <Text
                  style={
                    styles.signatureName
                  }
                >
                  {
                    convenerName
                  }
                </Text>

                <Text
                  style={
                    styles.signatureRole
                  }
                >
                  Convener, Loran EduHub
                </Text>
              </View>
            </View>

            {/* RIGHT CERTIFICATE INFO */}
            <View
              style={
                styles.detailsBlock
              }
            >
              <Text
                style={
                  styles.detailsLabel
                }
              >
                CERTIFICATE NUMBER
              </Text>

              <Text
                style={
                  styles.detailsValue
                }
              >
                {
                  certificateNumber
                }
              </Text>

              <Text
                style={
                  styles.detailsLabel
                }
              >
                DATE ISSUED
              </Text>

              <Text
                style={
                  styles.detailsValue
                }
              >
                {dateStr}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={
            styles.footerText
          }
        >
          LORAN EDUHUB • LEARNING • GROWTH • EXCELLENCE
        </Text>
      </Page>
    </Document>
  )
}

// ============================================================
// RENDER PDF
// ============================================================

export async function renderWorkshopCertificatePdf(
  props: WorkshopCertificateProps
): Promise<Buffer> {
  return renderToBuffer(
    <WorkshopCertDoc
      {...props}
    />
  )
}