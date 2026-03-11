"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Shared styles used by both PDF templates
const shared = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { textAlign: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 12, color: "#555", marginTop: 4 },
  row: { flexDirection: "row", marginBottom: 8 },
  label: { width: 160, fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  value: { flex: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginVertical: 12 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#333",
  },
});

// ─── WORK TICKET PDF ────────────────────────────────────────────────────────

interface WorkTicketProps {
  ticket: {
    id: number;
    createdAt: string;
    customerOrderNumber?: string | null;
    jobDescription: string;
    quantity: number;
    customer: {
      name: string;
      contactPerson?: string | null;
      contactCell?: string | null;
      telephoneNumber?: string | null;
    };
  };
}

export function WorkTicketPDF({ ticket }: WorkTicketProps) {
  return (
    <Document>
      <Page size="A4" style={shared.page}>
        <View style={shared.header}>
          <Text style={shared.title}>WORK TICKET</Text>
          <Text style={shared.subtitle}>#{ticket.id}</Text>
        </View>
        <View style={shared.divider} />
        <View style={shared.section}>
          <View style={shared.row}>
            <Text style={shared.label}>Work Ticket Number:</Text>
            <Text style={shared.value}>{ticket.id}</Text>
          </View>
          <View style={shared.row}>
            <Text style={shared.label}>Date:</Text>
            <Text style={shared.value}>
              {new Date(ticket.createdAt).toLocaleDateString("en-ZA")}
            </Text>
          </View>
        </View>
        <View style={shared.divider} />
        <View style={shared.section}>
          <Text style={shared.sectionTitle}>Customer Details</Text>
          <View style={shared.row}>
            <Text style={shared.label}>Customer Name:</Text>
            <Text style={shared.value}>{ticket.customer.name}</Text>
          </View>
          <View style={shared.row}>
            <Text style={shared.label}>Contact Person:</Text>
            <Text style={shared.value}>{ticket.customer.contactPerson || "-"}</Text>
          </View>
          <View style={shared.row}>
            <Text style={shared.label}>Contact Number:</Text>
            <Text style={shared.value}>
              {ticket.customer.contactCell || ticket.customer.telephoneNumber || "-"}
            </Text>
          </View>
          <View style={shared.row}>
            <Text style={shared.label}>Customer Order Number:</Text>
            <Text style={shared.value}>{ticket.customerOrderNumber || "-"}</Text>
          </View>
        </View>
        <View style={shared.divider} />
        <View style={shared.section}>
          <Text style={shared.sectionTitle}>Job Details</Text>
          <View style={shared.row}>
            <Text style={shared.label}>Job Description:</Text>
            <Text style={shared.value}>{ticket.jobDescription}</Text>
          </View>
          <View style={shared.row}>
            <Text style={shared.label}>Quantity:</Text>
            <Text style={shared.value}>{ticket.quantity}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── DELIVERY NOTE PDF ──────────────────────────────────────────────────────

const dnStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  copy: { marginBottom: 20 },
  copyLabel: { fontSize: 8, color: "#999", textAlign: "right", marginBottom: 4 },
  header: { textAlign: "center", marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#555", marginTop: 2 },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: 140, fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  value: { flex: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginVertical: 8 },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    borderBottomStyle: "dashed",
    marginVertical: 15,
    paddingBottom: 5,
  },
  section: { marginBottom: 10 },
  signatureSection: { marginTop: 20, flexDirection: "row", justifyContent: "space-between" },
  signatureBlock: { width: "45%" },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: "#000", marginTop: 30, marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: "#555" },
});

interface DeliveryNoteProps {
  note: {
    deliveryNoteNumber: number;
    createdAt: string;
    quantityDelivered: number;
    workTicket: {
      id: number;
      jobDescription: string;
      customer: { name: string };
    };
  };
}

// Single copy rendered twice on one page
function DeliveryNoteCopy({
  note,
  copyLabel,
}: DeliveryNoteProps & { copyLabel: string }) {
  return (
    <View style={dnStyles.copy}>
      <Text style={dnStyles.copyLabel}>{copyLabel}</Text>
      <View style={dnStyles.header}>
        <Text style={dnStyles.title}>DELIVERY NOTE</Text>
        <Text style={dnStyles.subtitle}>#{note.deliveryNoteNumber}</Text>
      </View>
      <View style={dnStyles.divider} />
      <View style={dnStyles.section}>
        <View style={dnStyles.row}>
          <Text style={dnStyles.label}>Delivery Note Number:</Text>
          <Text style={dnStyles.value}>{note.deliveryNoteNumber}</Text>
        </View>
        <View style={dnStyles.row}>
          <Text style={dnStyles.label}>Work Ticket Number:</Text>
          <Text style={dnStyles.value}>{note.workTicket.id}</Text>
        </View>
        <View style={dnStyles.row}>
          <Text style={dnStyles.label}>Date:</Text>
          <Text style={dnStyles.value}>
            {new Date(note.createdAt).toLocaleDateString("en-ZA")}
          </Text>
        </View>
      </View>
      <View style={dnStyles.divider} />
      <View style={dnStyles.section}>
        <View style={dnStyles.row}>
          <Text style={dnStyles.label}>Customer:</Text>
          <Text style={dnStyles.value}>{note.workTicket.customer.name}</Text>
        </View>
        <View style={dnStyles.row}>
          <Text style={dnStyles.label}>Job Description:</Text>
          <Text style={dnStyles.value}>{note.workTicket.jobDescription}</Text>
        </View>
        <View style={dnStyles.row}>
          <Text style={dnStyles.label}>Quantity Delivered:</Text>
          <Text style={dnStyles.value}>{note.quantityDelivered}</Text>
        </View>
      </View>
      <View style={dnStyles.signatureSection}>
        <View style={dnStyles.signatureBlock}>
          <View style={dnStyles.signatureLine} />
          <Text style={dnStyles.signatureLabel}>Delivered By (Signature)</Text>
        </View>
        <View style={dnStyles.signatureBlock}>
          <View style={dnStyles.signatureLine} />
          <Text style={dnStyles.signatureLabel}>Received By (Signature)</Text>
        </View>
      </View>
    </View>
  );
}

// Two copies on one page for signing
export function DeliveryNotePDF({ note }: DeliveryNoteProps) {
  return (
    <Document>
      <Page size="A4" style={dnStyles.page}>
        <DeliveryNoteCopy note={note} copyLabel="OFFICE COPY" />
        <View style={dnStyles.dashedDivider} />
        <DeliveryNoteCopy note={note} copyLabel="CUSTOMER COPY" />
      </Page>
    </Document>
  );
}
