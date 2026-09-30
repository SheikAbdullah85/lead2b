import { parseNaturalLanguageText, generateLeadVoiceBriefing } from '../src/lib/utils/speech';

const testInput = 'Met Dr. Sarah Jenkins from Cleveland Clinic Abu Dhabi. She is Vice President of Digital Health, email is sarah.j@clevelandclinic.ae, phone 0501234567. Very hot lead, urgently wants live demo of Enterprise AI next week. Follow up in 3 days.';

const parsed = parseNaturalLanguageText(testInput);
console.log('--- PARSED NATURAL LANGUAGE ---');
console.log(JSON.stringify(parsed, null, 2));

const briefing = generateLeadVoiceBriefing(parsed);
console.log('\n--- VOICE NOTE BRIEFING TEXT ---');
console.log(briefing);
