/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from "@react-pdf/renderer";
import React from "react";

// Register standard fonts to ensure formatting lines up beautifully across all operating systems
Font.register({
  family: "Helvetica-Bold",
  src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptug8z9oAjV04cmk1_661Njqw.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: "#1c1917", // Stone-900
  },
  sectionWrapper: {
    marginBottom: 12,
    width: "100%",
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4", // Stone-200
    marginVertical: 10,
    width: "100%",
  },
  // Personal Section
  name: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    fontSize: 9,
    color: "#57534e", // Stone-600
    marginTop: 4,
    gap: 6,
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    fontSize: 9,
    color: "#8bd000", // Your primary branding lime-green
    marginTop: 2,
    gap: 4,
  },
  // General Headers
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#1c1917",
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#44403c", // Stone-700
  },
  // Timeline Items
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0c0a09",
  },
  itemSubtitle: {
    fontSize: 9,
    color: "#8bd000",
    fontWeight: "bold",
  },
  itemDuration: {
    fontSize: 9,
    color: "#78716c",
    fontFamily: "Courier",
  },
  bulletPoint: {
    fontSize: 9,
    lineHeight: 1.3,
    color: "#44403c",
    paddingLeft: 12,
    position: "relative",
    marginBottom: 1,
  },
});

interface ResumePDFTemplateProps {
  data: {
    personalDetails: any;
    professionalSummary: string;
    skills: any[];
    experiences: any[];
    projects: any[];
    educations: any[];
    certificates: any[];
    sectionOrder: string[];
  };
}

export default function ResumePDFTemplate({ data }: ResumePDFTemplateProps) {
  const {
    personalDetails,
    professionalSummary,
    skills,
    experiences,
    projects,
    educations,
    certificates,
    sectionOrder,
  } = data;

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (
          !personalDetails?.name &&
          !personalDetails?.email &&
          !personalDetails?.phone
        )
          return null;
        return (
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <Text style={styles.name}>
              {personalDetails.name || "YOUR FULL NAME"}
            </Text>
            <View style={styles.contactRow}>
              {personalDetails.phone && <Text>{personalDetails.phone}</Text>}
              {personalDetails.email && <Text>| {personalDetails.email}</Text>}
              {personalDetails.address && (
                <Text>| {personalDetails.address}</Text>
              )}
            </View>
            {personalDetails.links?.length > 0 && (
              <View style={styles.linksRow}>
                {personalDetails.links.map((lnk: any, i: number) => (
                  <React.Fragment key={i}>
                    <Link
                      src={lnk.url}
                      style={{ textDecoration: "underline", color: "#8bd000" }}
                    >
                      <Text>{lnk.label || "Link"}</Text>
                    </Link>

                    {/* 🚀 MATCHED PERSISTENT PERIOD SEPARATOR FROM WEB PREVIEW */}
                    {i < personalDetails.links.length - 1 && (
                      <Text
                        style={{
                          color: "#1c1917",
                          marginLeft: 2,
                          marginRight: 2,
                          fontWeight: "bold",
                        }}
                      >
                        ·
                      </Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        );

      case "summary":
        if (!professionalSummary) return null;
        return (
          <View>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.bodyText}>{professionalSummary}</Text>
          </View>
        );

      case "skills":
        if (skills.length === 0) return null;
        const groupedSkills = skills.reduce((acc: any, curr: any) => {
          if (!curr.category || !curr.value) return acc;
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr.value);
          return acc;
        }, {});

        return (
          <View>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {Object.keys(groupedSkills).map((cat) => (
              <Text key={cat} style={styles.bodyText}>
                <Text style={{ fontWeight: "bold" }}>{cat}:</Text>{" "}
                {groupedSkills[cat].join(", ")}
              </Text>
            ))}
          </View>
        );

      case "experience":
        if (experiences.length === 0) return null;
        return (
          <View>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experiences.map((exp: any) => (
              <View key={exp.id} style={{ marginBottom: 6 }}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>
                    {exp.role} |{" "}
                    {exp.company && (
                      <Text style={styles.itemSubtitle}>{exp.company}</Text>
                    )}
                  </Text>
                  <Text style={styles.itemDuration}>{exp.duration}</Text>
                </View>
                {exp.bullets?.map((b: string, i: number) => (
                  <Text key={i} style={styles.bulletPoint}>
                    • {b}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      case "projects":
        if (projects.length === 0) return null;
        return (
          <View>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj: any) => (
              <View key={proj.id} style={{ marginBottom: 6 }}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>
                    {proj.title} |{" "}
                    {proj.links?.[0]?.url && (
                      <Link
                        src={proj.links[0].url}
                        style={{
                          textDecoration: "underline",
                          color: "#8bd000",
                        }}
                      >
                        <Text>{proj.links[0].label || "Link"}</Text>
                      </Link>
                    )}
                  </Text>
                  <Text style={styles.itemDuration}>{proj.duration}</Text>
                </View>
                {proj.description?.map((b: string, i: number) => (
                  <Text key={i} style={styles.bulletPoint}>
                    • {b}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      case "education":
        if (educations.length === 0) return null;
        return (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {educations.map((edu: any) => (
              <View key={edu.id} style={styles.itemHeaderRow}>
                <View>
                  <Text style={styles.itemTitle}>{edu.course}</Text>
                  <Text style={[styles.bodyText, { fontStyle: "italic" }]}>
                    {edu.schoolName}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.itemDuration}>{edu.duration}</Text>
                  {edu.gwa && (
                    <Text style={{ fontSize: 8 }}>GWA: {edu.gwa}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        );

      case "certificates":
        if (certificates.length === 0) return null;
        return (
          <View>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certificates.map((cert: any) => (
              <View key={cert.id} style={styles.itemHeaderRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: "bold" }}>{cert.title}</Text>
                  {cert.description && ` - ${cert.description}`}
                </Text>
                <Text style={styles.itemDuration}>{cert.issuedDate}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  // Pre-calculate visible structures exactly like your live browser preview component layout rules
  const visibleSections = sectionOrder.filter(
    (id) => renderSectionContent(id) !== null,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {visibleSections.map((sectionId, index) => {
          const content = renderSectionContent(sectionId);
          return (
            <View key={sectionId} style={styles.sectionWrapper}>
              {content}
              {index < visibleSections.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
