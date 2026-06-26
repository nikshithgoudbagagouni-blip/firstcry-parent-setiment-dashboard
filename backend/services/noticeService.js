/**
 * Notice & Communication Generator Service
 * 
 * Generates structured notice templates for parents based on context:
 * - Parent Meeting Invitation Notice
 * - Appreciation Message
 * - Warning/Care-call Alert Notice
 * - Follow-up Reminder Message
 */

/**
 * Generates communication content for notices
 * @param {string} type - 'meeting', 'appreciation', 'warning', 'reminder'
 * @param {object} parent - parent info (name, childName)
 * @param {object} details - dynamic details (date, time, keywords, score)
 */
function generateNotice(type, parent, details = {}) {
  const { name = 'Parent', studentName = 'Child' } = parent || {};
  const { dateTime = 'TBD', keywords = [], score = 0 } = details;
  
  const header = `--- FIRSTCRY INTELLITOTS COMMUNICATIONS ---\n`;
  
  switch (type.toLowerCase()) {
    case 'meeting':
      return {
        subject: `Parent-Teacher Interaction Schedule - ${studentName}`,
        body: `${header}
Dear Parent ${name},

We hope you and ${studentName} are having a wonderful week at FirstCry Intellitots.

To ensure we align closely on ${studentName}'s learning journey, social-emotional development, and classroom adaptation, we have scheduled an interactive meeting:

📅 Date/Time: ${dateTime}
📍 Location: Center Office / Online Meet

Our Center Head and class teachers will be present to share updates, answer any questions, and discuss any suggestions you have.

Please RSVP or request a reschedule using the school portal. We look forward to our discussion.

Warm regards,
Center Operations Team
FirstCry Intellitots`
      };
      
    case 'appreciation':
      return {
        subject: `Heartfelt Thank You from FirstCry Intellitots!`,
        body: `${header}
Dear ${name},

Thank you so much for taking the time to share your delightful feedback regarding our ${keywords.length > 0 ? keywords.join(', ') : 'classroom environment'}.

Knowing that you are happy with ${studentName}'s progress motivates our teachers and support staff to continue delivering the highest standards of early childhood care.

We are proud to have your family as part of the FirstCry Intellitots community!

Warm regards,
The Center Head
FirstCry Intellitots`
      };
      
    case 'warning':
      return {
        subject: `Urgent Care-Call Scheduling Request: ${studentName}`,
        body: `${header}
Dear ${name},

We have noted your recent concerns regarding ${keywords.length > 0 ? keywords.join(' and ') : 'your child’s experience'}. At FirstCry Intellitots, our primary commitment is the safety, happiness, and developmental progress of every child.

We take all feedback extremely seriously. We would like to arrange an urgent 1-on-1 meeting or call with our Center Head and pedagogical coordinator to address these issues and find immediate solutions.

A coordinator will contact you via phone shortly, or you may call us directly at our registered center number.

Thank you for helping us make FirstCry Intellitots a better place for ${studentName}.

Sincerely,
Center Administration & Support Team
FirstCry Intellitots`
      };
      
    case 'reminder':
      default:
        return {
          subject: `Weekly Engagement Update - FirstCry Intellitots`,
          body: `${header}
Dear ${name},

Just a gentle reminder to check out the School Portal this week for updates on ${studentName}'s classroom activities, worksheets, and upcoming center events.

Staying active in portal check-ins and completing our quick bi-weekly survey helps us personalize the learning path for ${studentName}.

If you have any questions, feel free to respond directly to this email or leave a note on the portal.

Best regards,
FirstCry Intellitots Portal Admin`
        };
  }
}

module.exports = {
  generateNotice
};
