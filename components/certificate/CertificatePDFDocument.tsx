// import React from "react";
// import {
//   Document,
//   Page,
//   Text,
//   View,
//   StyleSheet,
//   Image,
// } from "@react-pdf/renderer";

// // Reuse the same styles as the client preview to keep visual parity
// const styles = StyleSheet.create({
//   page: {
//     backgroundColor: "#ffffff",
//     padding: 0,
//     fontFamily: "Helvetica",
//   },
//   border: {
//     margin: 18,
//     border: "4pt solid #1e3a5f",
//     padding: 0,
//     height: "100%",
//   },
//   innerBorder: {
//     margin: 4,
//     border: "1pt solid #c9a84c",
//     padding: 18,
//     alignItems: "center",
//     height: "100%",
//   },
//   header: {
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   logo: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     marginBottom: 8,
//   },
//   orgName: {
//     fontSize: 10,
//     color: "#6b7280",
//     letterSpacing: 2,
//     textTransform: "uppercase",
//   },
//   dividerGold: {
//     height: 2,
//     backgroundColor: "#c9a84c",
//     width: "60%",
//     marginTop: 8,
//     marginBottom: 12,
//   },
//   titleLabel: {
//     fontSize: 10,
//     letterSpacing: 4,
//     color: "#6b7280",
//     textTransform: "uppercase",
//     marginBottom: 6,
//   },
//   title: {
//     fontSize: 28,
//     color: "#1e3a5f",
//     fontFamily: "Helvetica-Bold",
//     letterSpacing: 1,
//     marginBottom: 4,
//   },
//   titleSub: {
//     fontSize: 10,
//     color: "#6b7280",
//     letterSpacing: 1,
//     textTransform: "uppercase",
//     marginBottom: 12,
//   },
//   presentedTo: {
//     fontSize: 10,
//     color: "#6b7280",
//     letterSpacing: 2,
//     textTransform: "uppercase",
//     marginBottom: 6,
//   },
//   studentName: {
//     fontSize: 22,
//     fontFamily: "Helvetica-Bold",
//     color: "#1e3a5f",
//     marginBottom: 12,
//   },
//   bodyText: {
//     fontSize: 10,
//     color: "#374151",
//     textAlign: "center",
//     lineHeight: 1.6,
//     maxWidth: 460,
//     marginBottom: 6,
//   },
//   courseName: {
//     fontSize: 14,
//     fontFamily: "Helvetica-Bold",
//     color: "#c9a84c",
//     marginBottom: 4,
//   },
//   metaRow: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 10,
//     marginBottom: 18,
//     gap: 32,
//   },
//   metaItem: {
//     alignItems: "center",
//   },
//   metaLabel: {
//     fontSize: 8,
//     color: "#9ca3af",
//     letterSpacing: 1.5,
//     textTransform: "uppercase",
//   },
//   metaValue: {
//     fontSize: 11,
//     color: "#1e3a5f",
//     fontFamily: "Helvetica-Bold",
//     marginTop: 2,
//   },
//   dividerLight: {
//     height: 1,
//     backgroundColor: "#e5e7eb",
//     width: "80%",
//     marginBottom: 12,
//   },
//   signatureRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "80%",
//     marginBottom: 12,
//   },
//   signatureBlock: {
//     alignItems: "center",
//     width: "40%",
//   },
//   signatureLine: {
//     height: 1,
//     backgroundColor: "#1e3a5f",
//     width: "100%",
//     marginBottom: 4,
//   },
//   signatureLabel: {
//     fontSize: 9,
//     color: "#6b7280",
//     letterSpacing: 1,
//     textTransform: "uppercase",
//   },
//   signatureName: {
//     fontSize: 11,
//     fontFamily: "Helvetica-Bold",
//     color: "#1e3a5f",
//     marginTop: 2,
//   },
//   certId: {
//     fontSize: 8,
//     color: "#9ca3af",
//     letterSpacing: 1,
//     marginTop: 6,
//   },
// });

// export interface CertificatePDFProps {
//   certificateNumber: string;
//   studentName: string;
//   courseName: string;
//   instructorName?: string;
//   organizationName?: string;
//   issuedAt: string;
//   totalHours?: number;
//   logoBase64?: string | null;
// }

// export const CertificatePDFDocument: React.FC<CertificatePDFProps> = ({
//   certificateNumber,
//   studentName,
//   courseName,
//   instructorName,
//   organizationName = "CourseSphere",
//   issuedAt,
//   totalHours,
//   logoBase64,
// }) => (
//   <Document
//     title={`Certificate of Completion — ${courseName}`}
//     author={organizationName}
//     subject="Course Completion Certificate"
//   >
//     <Page size={[841.89, 595.28]} orientation="landscape" style={styles.page}>
//       <View style={styles.border}>
//         <View style={styles.innerBorder}>
//           <View style={styles.header}>
//             {logoBase64 ? (
//               <Image src={logoBase64} style={styles.logo} />
//             ) : (
//               // if no logo, leave space (the preview handles a fallback)
//               <View style={{ height: 56, marginBottom: 8 }} />
//             )}
//             <Text style={styles.orgName}>{organizationName}</Text>
//             <View style={styles.dividerGold} />
//           </View>

//           <Text style={styles.titleLabel}>Certificate of</Text>
//           <Text style={styles.title}>Completion</Text>
//           <Text style={styles.titleSub}>This is to certify that</Text>

//           <Text style={styles.studentName}>{studentName}</Text>

//           <Text style={styles.bodyText}>
//             has successfully completed all the lessons and requirements of the
//             course
//           </Text>
//           <Text style={styles.courseName}>&quot;{courseName}&quot;</Text>
//           <Text style={styles.bodyText}>
//             and is hereby awarded this certificate in recognition of their
//             dedication and achievement.
//           </Text>

//           <View style={styles.metaRow}>
//             <View style={styles.metaItem}>
//               <Text style={styles.metaLabel}>Date Issued</Text>
//               <Text style={styles.metaValue}>{issuedAt}</Text>
//             </View>
//             {totalHours !== undefined && (
//               <View style={styles.metaItem}>
//                 <Text style={styles.metaLabel}>Course Duration</Text>
//                 <Text style={styles.metaValue}>{totalHours} Hours</Text>
//               </View>
//             )}
//             <View style={styles.metaItem}>
//               <Text style={styles.metaLabel}>Certificate ID</Text>
//               <Text style={styles.metaValue}>{certificateNumber}</Text>
//             </View>
//           </View>

//           <View style={styles.dividerLight} />

//           <View style={styles.signatureRow}>
//             <View style={styles.signatureBlock}>
//               <View style={styles.signatureLine} />
//               <Text style={styles.signatureLabel}>Instructor</Text>
//               <Text style={styles.signatureName}>{instructorName ?? "—"}</Text>
//             </View>
//             <View style={styles.signatureBlock}>
//               <View style={styles.signatureLine} />
//               <Text style={styles.signatureLabel}>Platform</Text>
//               <Text style={styles.signatureName}>{organizationName}</Text>
//             </View>
//           </View>

//           <Text style={styles.certId}>Certificate No: {certificateNumber}</Text>
//         </View>
//       </View>
//     </Page>
//   </Document>
// );

// export default CertificatePDFDocument;

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
  Circle,
  Polygon,
  Line,
  Rect,
} from "@react-pdf/renderer";

// ─── Page: A4 Landscape 16:9-ish ─────────────────────────────────────────────
const PW = 1122; // ~297mm at 96dpi landscape
const PH = 794; // ~210mm

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  blue: "#2563EB",
  yellow: "#F59E0B",
  red: "#EF4444",
  white: "#ffffff",
  black: "#111111",
  textMid: "#444444",
  textLight: "#888888",
  lineGray: "#cccccc",
  bgGray: "#f8f8f8",
  diagLine: "rgba(255,255,255,0.12)",
};

// ─── Hex path helper ──────────────────────────────────────────────────────────
function hexPath(cx: number, cy: number, r: number): string {
  return (
    Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      return `${i === 0 ? "M" : "L"}${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
    }).join(" ") + " Z"
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    width: PW,
    height: PH,
    backgroundColor: C.white,
    fontFamily: "Helvetica",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PW,
    height: PH,
  },

  // ── Left blue panel ──
  leftPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 380,
    height: PH,
    backgroundColor: C.blue,
  },

  // ── Left panel content ──
  leftContent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 380,
    height: PH,
    alignItems: "center",
    paddingTop: 60,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 14,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 48,
    marginBottom: 16,
    width: 280,
  },
  dividerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.white,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.white,
    marginHorizontal: 6,
  },
  certWord: {
    fontSize: 44,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 1,
    lineHeight: 1,
  },
  certSub: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 6,
  },
  dividerRow2: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    width: 280,
  },

  // ── Right panel ──
  rightContent: {
    position: "absolute",
    top: 0,
    left: 380,
    right: 0,
    height: PH,
    // center the content vertically and horizontally inside the right panel
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 70,
    paddingRight: 90,
  },
  presentedLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.textMid,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  recipientName: {
    fontSize: 58,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    letterSpacing: -1,
    lineHeight: 1.1,
    marginBottom: 16,
    textAlign: "center",
  },
  nameLine: {
    height: 1,
    backgroundColor: C.lineGray,
    marginBottom: 22,
    width: "100%",
  },
  bodyText: {
    fontSize: 11,
    color: C.textMid,
    textAlign: "center",
    lineHeight: 1.7,
    marginBottom: 0,
  },

  // ── Signature row ──
  sigRow: {
    position: "absolute",
    bottom: 56,
    left: 450,
    right: 90,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sigBlock: { alignItems: "center", width: 180 },
  sigLine: {
    height: 1,
    width: 180,
    backgroundColor: C.black,
    marginBottom: 6,
  },
  sigLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sigValue: {
    fontSize: 11,
    color: C.textMid,
    marginTop: 2,
    textAlign: "center",
  },
  certId: {
    position: "absolute",
    left: 420,
    bottom: 18,
    fontSize: 8,
    color: C.textLight,
    letterSpacing: 1,
  },
});

// ─── Left panel diagonal lines (decorative) ───────────────────────────────────
const DiagLines: React.FC = () => (
  <Svg
    width={380}
    height={PH}
    viewBox={`0 0 380 ${PH}`}
    style={{ position: "absolute", top: 0, left: 0 }}
  >
    {Array.from({ length: 18 }, (_, i) => {
      const x = -100 + i * 50;
      return (
        <Line
          key={i}
          x1={x}
          y1={0}
          x2={x + PH}
          y2={PH}
          stroke={C.diagLine}
          strokeWidth={1}
        />
      );
    })}
  </Svg>
);

// ─── Full-page decorative SVG ─────────────────────────────────────────────────
const Decorations: React.FC = () => (
  <Svg
    width={PW}
    height={PH}
    viewBox={`0 0 ${PW} ${PH}`}
    style={{ position: "absolute", top: 0, left: 0 }}
  >
    {/* ── Yellow diagonal stripes top-center ── */}
    <Path d={`M520,0 L600,0 L440,160 L360,160 Z`} fill={C.yellow} />
    <Path
      d={`M560,0 L640,0 L480,160 L400,160 Z`}
      fill={C.yellow}
      opacity={0.5}
    />

    {/* ── Red rectangle top-right ── */}
    <Rect x={PW - 160} y={0} width={160} height={80} fill={C.red} />

    {/* ── Blue chevron right-mid ── */}
    <Path
      d={`M${PW},${PH * 0.35} L${PW - 70},${PH * 0.47} L${PW},${PH * 0.59} Z`}
      fill={C.blue}
    />

    {/* ── Dot grid top-right ── */}
    {[0, 1, 2, 3].map((col) =>
      [0, 1, 2].map((row) => (
        <Circle
          key={`${col}-${row}`}
          cx={PW - 160 + col * 22}
          cy={100 + row * 22}
          r={4}
          fill={C.yellow}
        />
      )),
    )}

    {/* ── Dot grid bottom-left (on blue panel) ── */}
    {[0, 1, 2].map((col) => (
      <Circle
        key={`bl-${col}`}
        cx={40 + col * 22}
        cy={PH - 80}
        r={5}
        fill={C.white}
      />
    ))}

    {/* ── Dot grid bottom-left lower ── */}
    {[0, 1, 2, 3].map((col) =>
      [0, 1].map((row) => (
        <Circle
          key={`bll-${col}-${row}`}
          cx={30 + col * 22}
          cy={PH - 30 + row * 22}
          r={4}
          fill={C.yellow}
          opacity={0.8}
        />
      )),
    )}

    {/* ── Blue mountain triangle bottom-center-left ── */}
    <Path d={`M250,${PH} L420,${PH * 0.72} L590,${PH} Z`} fill={C.blue} />

    {/* ── Red triangle overlapping bottom ── */}
    <Path d={`M420,${PH} L530,${PH * 0.78} L640,${PH} Z`} fill={C.red} />

    {/* ── Yellow trapezoid bottom-left ── */}
    <Path
      d={`M0,${PH * 0.68} L0,${PH} L260,${PH} L380,${PH * 0.68} Z`}
      fill={C.yellow}
      opacity={0.9}
    />

    {/* ── Diagonal line grid bottom-right (light) ── */}
    {Array.from({ length: 8 }, (_, i) => {
      const x = PW - 80 + i * 28;
      return (
        <Line
          key={`dr-${i}`}
          x1={x}
          y1={PH * 0.6}
          x2={x + 120}
          y2={PH}
          stroke={C.lineGray}
          strokeWidth={1}
          opacity={0.5}
        />
      );
    })}

    {/* ── Single yellow dot bottom-right area ── */}
    <Circle cx={PW - 260} cy={PH - 60} r={6} fill={C.yellow} />
  </Svg>
);

// ─── Hexagon logo icon ────────────────────────────────────────────────────────
const HexIcon: React.FC = () => (
  <Svg width={72} height={72} viewBox="0 0 72 72">
    {/* Outer hex */}
    <Path
      d={hexPath(36, 36, 33)}
      fill="none"
      stroke={C.white}
      strokeWidth={2.5}
    />
    {/* Inner hex */}
    <Path
      d={hexPath(36, 36, 20)}
      fill="none"
      stroke={C.white}
      strokeWidth={2}
    />
    {/* Center dot */}
    <Circle cx={36} cy={36} r={4} fill={C.white} />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface CertificateAppreciationProps {
  recipientName: string;
  organizationName?: string;
  subtitle?: string;
  bodyText?: string;
  dateLabel?: string;
  signatureLabel?: string;
  logoBase64?: string | null;
  // optional concrete values to display
  dateValue?: string;
  signatureName?: string;
  certificateNumber?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const CertificateAppreciationPDF: React.FC<
  CertificateAppreciationProps
> = ({
  recipientName,
  organizationName = "COMPANY NAME",
  subtitle = "OF APPRECIATION",
  bodyText = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  dateLabel = "DATE",
  signatureLabel = "SIGNATURE",
  logoBase64,
  dateValue,
  signatureName,
  certificateNumber,
}) => (
  <Document
    title={`Certificate of Appreciation — ${recipientName}`}
    author={organizationName}
    subject="Certificate of Appreciation"
  >
    <Page size={[PW, PH]} style={styles.page}>
      <View style={styles.canvas}>
        {/* ── Blue left panel background ── */}
        <View style={styles.leftPanel} />

        {/* ── Diagonal lines on blue panel ── */}
        <DiagLines />

        {/* ── All decorative SVG shapes ── */}
        <Decorations />

        {/* ── Left panel content ── */}
        <View style={styles.leftContent}>
          {logoBase64 ? (
            <Image src={logoBase64} style={{ width: 72, height: 72 }} />
          ) : (
            <HexIcon />
          )}
          <Text style={styles.companyName}>{organizationName}</Text>

          {/* Top divider with dots */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
          </View>

          <Text style={styles.certWord}>CERTIFICATE</Text>
          <Text style={styles.certSub}>{subtitle}</Text>

          {/* Bottom divider with dots */}
          <View style={styles.dividerRow2}>
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
          </View>
        </View>

        {/* ── Right panel content ── */}
        <View style={styles.rightContent}>
          <Text style={styles.presentedLabel}>
            This Certificate is Presented to
          </Text>
          <Text style={styles.recipientName}>{recipientName}</Text>
          <View style={styles.nameLine} />
          <Text style={styles.bodyText}>{bodyText}</Text>
        </View>

        {/* ── Signature row ── */}
        <View style={styles.sigRow}>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>{dateLabel}</Text>
            {dateValue ? (
              <Text style={styles.sigValue}>{dateValue}</Text>
            ) : null}
          </View>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>{signatureLabel}</Text>
            {signatureName ? (
              <Text style={styles.sigValue}>{signatureName}</Text>
            ) : null}
          </View>
        </View>

        {certificateNumber ? (
          <Text style={styles.certId}>Certificate No: {certificateNumber}</Text>
        ) : null}
      </View>
    </Page>
  </Document>
);

export default CertificateAppreciationPDF;

// ─── Usage ────────────────────────────────────────────────────────────────────
//
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import CertificateAppreciationPDF from "./CertificateAppreciationPDF";
//
// <PDFDownloadLink
//   document={
//     <CertificateAppreciationPDF
//       recipientName="Brandon Lee"
//       organizationName="COMPANY NAME"
//       subtitle="OF APPRECIATION"
//       bodyText="For outstanding contributions and dedication..."
//       dateLabel="DATE"
//       signatureLabel="SIGNATURE"
//       logoBase64={null}
//     />
//   }
//   fileName="certificate-appreciation.pdf"
// >
//   {({ loading }) => (loading ? "Generating…" : "Download Certificate")}
// </PDFDownloadLink>
