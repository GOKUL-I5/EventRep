import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useEvent } from '../context/EventContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { FiDownload, FiXCircle, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

const MyTickets = () => {
  const { myTickets, events, cancelTicket } = useEvent();
  const qrRefs = useRef({});

  const handleCancel = async (ticketId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await cancelTicket(ticketId);
        toast.success("Booking cancelled successfully.");
      } catch (error) {
        toast.error("Failed to cancel booking.");
      }
    }
  };

  const downloadTicketAsPDF = (ticket, event) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Background color
      doc.setFillColor(15, 23, 42); // --color-bg-base
      doc.rect(0, 0, 210, 297, 'F');

      // Header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("EVENTX TICKET PASS", 105, 30, { align: 'center' });

      // Ticket Card
      doc.setFillColor(30, 41, 59); // surface
      doc.roundedRect(20, 50, 170, 160, 5, 5, 'F');

      // Event Details
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // accent
      doc.text(event.title, 30, 70);

      doc.setFontSize(12);
      doc.setTextColor(200, 200, 200);
      doc.text(`Date: ${event.date} at ${event.time}`, 30, 85);
      doc.text(`Location: ${event.location}`, 30, 95);
      doc.text(`Category: ${event.category.toUpperCase()}`, 30, 105);

      doc.setDrawColor(255, 255, 255);
      doc.line(30, 115, 180, 115);

      doc.text(`Ticket ID: ${ticket.id}`, 30, 130);
      doc.text(`Status: VALID`, 30, 140);
      
      // Extract QR Code Base64 from the DOM SVG
      const svgElement = qrRefs.current[ticket.id];
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL("image/png");
          
          doc.addImage(pngFile, 'PNG', 120, 125, 60, 60);
          
          // Save the PDF
          doc.save(`Ticket_${event.title.replace(/\s+/g, '_')}.pdf`);
          toast.success("Ticket downloaded successfully!");
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      } else {
        toast.error("Could not generate QR code image.");
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Tickets</h1>

        {myTickets.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>No Active Bookings</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>You haven't registered for any upcoming events.</p>
            <Link to="/explore" style={{ padding: '0.75rem 1.5rem', background: 'var(--color-accent)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>Explore Events</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {myTickets.map((ticket) => {
              const event = events.find(e => e.id === ticket.eventId);
              if (!event) return null;

              return (
                <motion.div 
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                  style={{ display: 'flex', overflow: 'hidden' }}
                >
                  {/* Left Side: Event Info */}
                  <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>{event.category}</span>
                        <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{event.title}</h2>
                      </div>
                      <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600' }}>Confirmed</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><FiCalendar /> {event.date}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><FiClock /> {event.time}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><FiMapPin /> {event.location}</div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                      <button 
                        onClick={() => downloadTicketAsPDF(ticket, event)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-accent)', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        <FiDownload /> Download Pass
                      </button>
                      <button 
                        onClick={() => handleCancel(ticket.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        <FiXCircle /> Cancel Booking
                      </button>
                    </div>
                  </div>

                  {/* Right Side: QR Code (Visual stub, perforated line) */}
                  <div style={{ width: '250px', background: 'rgba(255,255,255,0.02)', borderLeft: '2px dashed var(--color-glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                      <QRCodeSVG 
                        value={ticket.qrCodeData} 
                        size={150} 
                        ref={(el) => (qrRefs.current[ticket.id] = el)} 
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>ID: {ticket.id}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTickets;
