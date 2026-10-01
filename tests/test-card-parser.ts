import { parseBusinessCardText } from '../src/lib/ocr/card-parser';

const sampleCards = [
  {
    name: 'Sample 1: Multi-field contact line with UAE mobile and Tel',
    text: `
      ALPHATECH SOLUTIONS LLC
      Tariq Mansoor
      Head of Operations
      Mob: +971 50 123 4567 | Tel: +971 4 399 8888
      Email: tariq.m@alphatech.ae
      Web: www.alphatech.ae
      Office 402, Building 3, Bay Square, Business Bay, Dubai, UAE
    `
  },
  {
    name: 'Sample 2: Mobile without "Mob" prefix, combined email/phone line',
    text: `
      Dr. Sarah Jenkins
      VP of Digital Health
      CLEVELAND CLINIC ABU DHABI
      sarah.jenkins@clevelandclinic.ae | +971559876543
      Al Maryah Island, Abu Dhabi, United Arab Emirates
      www.clevelandclinicabudhabi.ae
    `
  },
  {
    name: 'Sample 3: Card with Tel and Fax and Mobile',
    text: `
      ARISTOSTAR RETAIL SYSTEMS
      Ahmed Al Nuaimi
      Sales Director
      Direct: +971-52-944-1234
      T: +971 4 222 3333 | F: +971 4 222 3334
      ahmed@aristostar.com
      Dubai World Trade Centre, P.O. Box 9292, Dubai
    `
  },
  {
    name: 'Sample 4: International format (Saudi / US / India)',
    text: `
      GLOBAL LOGISTICS CORP
      Mohammad Al-Otaibi
      Managing Director
      Cell: +966 50 555 1234
      Email: m.otaibi@globallogistics.sa
      Riyadh, Kingdom of Saudi Arabia
    `
  },
  {
    name: 'Sample 5: Raw Tesseract OCR Output with artifacts',
    text: `
      DUBAI COMMERCIAL BANK
      KHALID BIN RASHID
      SENIOR RELATIONSHIP MANAGER
      PO Box 8832, Sheikh Zayed Road, Dubai
      M +971 50 777 8899
      T +971 4 311 2233
      khalid.rashid@dcb.ae
      www.dcb.ae
    `
  },
  {
    name: 'Sample 6: Qatar/GCC format with slash delimiters',
    text: `
      QATAR PETROLEUM SOLUTIONS
      Nasser Al-Kuwari
      Operations Director
      +974 4412 3456 / +974 5512 3456
      nasser@qps.qa
      Doha, Qatar
    `
  },
  {
    name: 'Sample 7: Standalone local UAE mobile (050...) and landline without prefix',
    text: `
      EMIRATES CLOUD SYSTEMS LLC
      Fatima Al-Zahra
      Lead Architect
      Tel: 04 321 0000 | Mob: 050 888 9911
      fatima@emiratescloud.ae
      www.emiratescloud.ae
    `
  },
  {
    name: 'Sample 8: India Mobile with WhatsApp badge',
    text: `
      TCS GLOBAL CONSULTING
      Rajesh Kumar
      Senior Consultant
      WA: +91 98765 43210
      rajesh.k@tcsglobal.com
      Dubai Internet City, Building 14, UAE
    `
  }
];

console.log('=== BENCHMARKING BUSINESS CARD PARSER ===\n');

for (const card of sampleCards) {
  console.log(`\x1b[36m--- ${card.name} ---\x1b[0m`);
  const parsed = parseBusinessCardText(card.text);
  console.log({
    Name: `${parsed.firstName} ${parsed.lastName}`.trim(),
    Company: parsed.company,
    Title: parsed.designation,
    Email: parsed.email,
    Phone: parsed.phone,
    Website: parsed.website
  });
  console.log('\n');
}
