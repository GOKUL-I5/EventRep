import { jsPDF } from 'jspdf';

/**
 * Utility to load an image URL and convert it to Base64 using a temporary canvas.
 * Resolves with null if it fails or faces CORS issues.
 */
const loadImageBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataURL);
        } catch (err) {
          console.warn("Failed canvas toDataURL conversion for PDF ticket cover:", err);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn("Failed loading ticket cover image for base64 PDF generation:", url);
      resolve(null);
    };
    img.src = url;
  });
};

/**
 * Generates and downloads a visual PDF ticket pass.
 * @param {Object} event - Event details object
 * @param {Object} booking - Booking details object
 * @param {string} qrCodeDataUrl - Base64 Data URL of the QR code canvas
 */
export const downloadPDFTicket = async (event, booking, qrCodeDataUrl) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6' // 105mm x 148mm
    });

    // 1. Draw premium dark background (#0a0f1d)
    doc.setFillColor(10, 15, 29);
    doc.rect(0, 0, 105, 148, 'F');

    // 2. Draw brand header neon top border (#6366f1)
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 105, 4, 'F');

    // 3. Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('EVENTX ENTRY PASS', 52.5, 12, { align: 'center' });

    // Header partition line
    doc.setDrawColor(255, 255, 255, 0.1);
    doc.setLineWidth(0.3);
    doc.line(8, 16, 97, 16);

    // 4. Load & render Event Cover Image (CORS Safe)
    const coverUrl = event.imageUrl || event.coverUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600';
    const coverBase64 = await loadImageBase64(coverUrl);

    if (coverBase64) {
      try {
        doc.addImage(coverBase64, 'JPEG', 8, 20, 89, 38);
      } catch (err) {
        console.error("Error adding cover image to PDF:", err);
        // Fallback card background
        doc.setFillColor(21, 30, 46);
        doc.rect(8, 20, 89, 38, 'F');
      }
    } else {
      // Fallback card background if image failed/CORS
      doc.setFillColor(21, 30, 46);
      doc.rect(8, 20, 89, 38, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('EVENT ACCESS TICKET', 52.5, 39, { align: 'center' });
    }

    // 5. Event Details (Title, Date, Venue)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const splitTitle = doc.splitTextToSize((event.title || 'Special Event').toUpperCase(), 85);
    doc.text(splitTitle, 52.5, 64, { align: 'center' });

    // Date & Time
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const eventTime = event.time || '09:00 AM';
    doc.text(`DATE: ${event.date}   TIME: ${eventTime}`, 52.5, 73, { align: 'center' });

    // Venue/Location
    const venueText = `VENUE: ${event.venue || event.location || 'Online Session'}`;
    const splitVenue = doc.splitTextToSize(venueText.toUpperCase(), 85);
    doc.text(splitVenue, 52.5, 77, { align: 'center' });

    // 6. Attendee Info Container Card
    doc.setFillColor(20, 29, 47);
    doc.rect(8, 83, 89, 25, 'F');
    doc.setDrawColor(255, 255, 255, 0.05);
    doc.rect(8, 83, 89, 25, 'S');

    // Column 1: Attendee details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(129, 140, 248); // Indigo color
    doc.text('ATTENDEE', 12, 88);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(booking.attendeeName || 'Guest Registrant', 12, 93);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(booking.attendeeEmail || '', 12, 97);
    doc.text(booking.attendeePhone || '', 12, 101);
    
    const addressLabel = doc.splitTextToSize(booking.attendeeAddress || '', 40);
    doc.text(addressLabel, 12, 105);

    // Column 2: Ticket Type & Qty
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(129, 140, 248);
    doc.text('TICKET TIER', 58, 88);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text((booking.ticketType || 'General').toUpperCase(), 58, 93);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Quantity: ${booking.quantity || 1}`, 58, 98);
    doc.text(`Amount: ${booking.amount === 0 ? 'Free' : `INR ${booking.amount}`}`, 58, 103);

    // 7. Cut-off line
    doc.setDrawColor(255, 255, 255, 0.1);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(8, 112, 97, 112);

    // 8. QR Code Image
    if (qrCodeDataUrl) {
      try {
        doc.addImage(qrCodeDataUrl, 'JPEG', 42.5, 115, 20, 20);
      } catch (err) {
        console.error("Error adding QR code image to ticket PDF:", err);
      }
    }

    // 9. Scan instructions & Booking ID
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PRESENT THIS TICKET AT ACCESS PORTALS TO SCAN', 52.5, 139, { align: 'center' });

    doc.setFont('monospace', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(129, 140, 248);
    doc.text(`PASS ID: ${booking.bookingId.substring(0, 16).toUpperCase()}`, 52.5, 143, { align: 'center' });

    // Download PDF
    const filename = `Ticket-${(event.title || 'Event').replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error("PDF generator failure:", error);
    throw error;
  }
};
