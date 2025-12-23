const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Create a PDF ticket for a booking
 * @param {object} bookingData - Booking data containing passenger info, flight info, etc.
 * @param {string} outputPath - Path where PDF should be saved
 * @returns {Promise<string>} Path to the generated PDF
 */
const generateTicketPDF = async (bookingData) => {
  try {
    const {
      passengerName,
      passenger_details,
      airline,
      flightId,
      departureCity,
      arrivalCity,
      departureTime,
      arrivalTime,
      flightDate,
      pnr,
      pricePaid,
      bookingDate,
      bookingId,
      legLabel // optional label like 'Outbound' or 'Return'
    } = bookingData;

    // Create directory for PDFs if it doesn't exist
    const pdfDir = path.join(__dirname, '../tickets');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Create PDF file path
    const fileName = `ticket_${pnr}_${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Pipe to file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Modern Header with blue background effect
    doc.rect(50, 50, 500, 80).fillAndStroke('#1e40af', '#1e40af');
    doc.fontSize(28).font('Helvetica-Bold').fillColor('white').text('✈ FLIGHT TICKET', 50, 70, { align: 'center', width: 500 });
    doc.fontSize(12).font('Helvetica').text('Booking Confirmation', 50, 100, { align: 'center', width: 500 });
    doc.fillColor('black');
    
    doc.moveDown(2);

    // PNR Box - Modern card style
    doc.rect(50, doc.y, 500, 50).fillAndStroke('#dbeafe', '#3b82f6');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('PNR', 70, doc.y + 10);
    doc.fontSize(20).font('Helvetica-Bold').text(pnr, 70, doc.y + 25);
    doc.fillColor('black');
    doc.moveDown(1.5);

    // Leg Label if round trip
    if (legLabel) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#059669').text(legLabel.toUpperCase(), { align: 'center' });
      doc.fillColor('black');
      doc.moveDown(0.5);
    }

    // Passenger Information Card
    const passengers = Array.isArray(passenger_details) && passenger_details.length > 0
      ? passenger_details
      : (passengerName ? [{ name: passengerName }] : []);
    
    const passengerStartY = doc.y;
    doc.rect(50, passengerStartY, 500, 40 + (passengers.length * 25)).stroke('#e5e7eb').fill('#f9fafb');
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937').text('Passenger Information', 70, passengerStartY + 15);

    passengers.forEach((p, idx) => {
      const passengerY = passengerStartY + 40 + (idx * 25);
      const passengerText = `${idx + 1}. ${p.name}${p.age ? ` (Age: ${p.age})` : ''}`;
      doc.fontSize(11).font('Helvetica').fillColor('#374151').text(passengerText, 70, passengerY);
    });
    
    doc.y = passengerStartY + 40 + (passengers.length * 25) + 20;
    doc.fillColor('black');

    // Flight Details Card - Modern layout
    const flightStartY = doc.y;
    doc.rect(50, flightStartY, 500, 180).stroke('#3b82f6').fill('#eff6ff');
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af').text('Flight Details', 70, flightStartY + 15);
    
    // Airline and Flight ID
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('AIRLINE', 70, flightStartY + 40);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937').text(airline, 70, flightStartY + 55);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('FLIGHT ID', 350, flightStartY + 40);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937').text(flightId, 350, flightStartY + 55);
    
    // Route with arrow
    const routeY = flightStartY + 90;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('FROM', 70, routeY);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2563eb').text(departureCity, 70, routeY + 15);
    doc.fontSize(12).font('Helvetica').fillColor('#374151').text(departureTime || 'N/A', 70, routeY + 35);
    
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#3b82f6').text('→', 280, routeY + 20);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('TO', 350, routeY);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#059669').text(arrivalCity, 350, routeY + 15);
    doc.fontSize(12).font('Helvetica').fillColor('#374151').text(arrivalTime || 'N/A', 350, routeY + 35);
    
    // Flight Date - Fixed formatting
    const dateY = flightStartY + 145;
    const displayDate = flightDate ? (() => {
      const date = new Date(flightDate + 'T00:00:00');
      const day = date.getDate();
      const month = date.toLocaleDateString('en-IN', { month: 'short' });
      const year = date.getFullYear();
      const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
      return `${dayName}, ${day} ${month} ${year}`;
    })() : 'N/A';

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('FLIGHT DATE', 70, dateY);
    doc.fontSize(12).font('Helvetica').fillColor('#1f2937').text(displayDate, 70, dateY + 15);
    
    doc.y = flightStartY + 200;
    doc.fillColor('black');

    // Price Information Card
    const priceStartY = doc.y;
    doc.rect(50, priceStartY, 500, 60).stroke('#f59e0b').fill('#fffbeb');
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#92400e').text('AMOUNT PAID', 70, priceStartY + 15);
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#b45309').text(`₹${pricePaid.toLocaleString('en-IN')}`, 70, priceStartY + 30);
    
    doc.y = priceStartY + 80;
    
    // Booking Date & Time - Fixed formatting
    const bookingDateTime = (() => {
      const date = new Date(bookingDate);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-IN', { month: 'short' });
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} at ${hours}:${minutes}`;
    })();
    
    doc.fontSize(9).font('Helvetica').fillColor('#6b7280').text(`Booking Date & Time: ${bookingDateTime}`, 70);
    doc.moveDown(1);

    // Footer
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#374151').text(
      'Thank you for booking with us! Please carry this ticket for check-in.',
      50,
      doc.y,
      { align: 'center', width: 500 }
    );
    
    const generatedDateTime = (() => {
      const date = new Date();
      const day = date.getDate();
      const month = date.toLocaleDateString('en-IN', { month: 'short' });
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} at ${hours}:${minutes}`;
    })();
    
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af').text(
      `Generated on ${generatedDateTime}`,
      50,
      doc.y + 15,
      { align: 'center', width: 500 }
    );
    doc.fillColor('black');

    // Finalize PDF
    doc.end();

    // Return promise that resolves when file is written
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(filePath);
      });
      stream.on('error', reject);
      doc.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Error generating PDF: ${error.message}`);
  }
};

/**
 * Get PDF file path for a booking by PNR
 * @param {string} pnr - Passenger Name Record
 * @returns {string|null} Path to PDF if exists, null otherwise
 */
const getPDFPathByPNR = (pnr) => {
  try {
    const pdfDir = path.join(__dirname, '../tickets');
    if (!fs.existsSync(pdfDir)) {
      return null;
    }

    const files = fs.readdirSync(pdfDir);
    const ticketFile = files.find((file) => file.includes(`ticket_${pnr}`));

    return ticketFile ? path.join(pdfDir, ticketFile) : null;
  } catch (error) {
    throw new Error(`Error finding PDF: ${error.message}`);
  }
};

module.exports = {
  generateTicketPDF,
  getPDFPathByPNR,
};
