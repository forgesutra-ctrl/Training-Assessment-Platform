# Email Notification Templates

Email templates for the Training Assessment Platform. These can be used with Supabase Edge Functions or external email services.

## 📧 Template Variables

- `{userName}` - User's full name
- `{userEmail}` - User's email address
- `{trainerName}` - Trainer's name (for assessment notifications)
- `{managerName}` - Manager's name
- `{rating}` - Average rating
- `{date}` - Assessment date
- `{platformName}` - Platform name
- `{loginUrl}` - Login URL
- `{supportEmail}` - Support email

## 1. Welcome Email

**Subject:** Welcome to {platformName}!

**Body:**
```
Hello {userName},

Welcome to the Training Assessment Platform!

Your account has been created with the following details:
- Email: {userEmail}
- Role: {role}
- Team: {teamName}

Your temporary password is: {password}

Please log in and change your password immediately:
{loginUrl}

If you have any questions, please contact support at {supportEmail}.

Best regards,
The {platformName} Team
```

## 2. Assessment Received Notification

**Subject:** New Assessment Received - {date}

**Body:**
```
Hello {userName},

You have received a new assessment from {managerName}.

Assessment Details:
- Date: {date}
- Average Rating: {rating}/5.0

View your full assessment and feedback:
{loginUrl}

Keep up the great work!

Best regards,
The {platformName} Team
```

## 3. Monthly Summary Email

**Subject:** Your Monthly Performance Summary - {month}

**Body:**
```
Hello {userName},

Here's your performance summary for {month}:

📊 Performance Overview:
- Assessments Received: {assessmentCount}
- Average Rating: {averageRating}/5.0
- Best Parameter: {bestParameter}
- Area for Improvement: {improvementArea}

View your detailed performance dashboard:
{loginUrl}

Continue the excellent work!

Best regards,
The {platformName} Team
```

## 4. Assessment Reminder (Manager)

**Subject:** Reminder: Submit Your Assessments

**Body:**
```
Hello {userName},

This is a friendly reminder that you have pending assessments to submit.

You have assessed {completedCount} trainers this month.
Target: {targetCount} assessments per month

Submit your assessments:
{loginUrl}

Thank you for your continued participation!

Best regards,
The {platformName} Team
```

## 5. Weekly Digest (Admin)

**Subject:** Weekly Platform Activity Digest - {week}

**Body:**
```
Hello {userName},

Here's your weekly platform activity summary:

📈 Platform Statistics:
- Total Assessments This Week: {weeklyAssessments}
- Active Managers: {activeManagers}
- Active Trainers: {activeTrainers}
- Platform Average Rating: {platformAverage}/5.0

View detailed analytics:
{loginUrl}

Best regards,
The {platformName} Team
```

## 6. Password Reset Email

**Subject:** Password Reset Request

**Body:**
```
Hello {userName},

You requested to reset your password for {platformName}.

Click the link below to reset your password:
{resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email or contact support at {supportEmail}.

Best regards,
The {platformName} Team
```

## 7. Password Changed Confirmation

**Subject:** Password Successfully Changed

**Body:**
```
Hello {userName},

Your password has been successfully changed.

If you didn't make this change, please contact support immediately at {supportEmail}.

Best regards,
The {platformName} Team
```

## 8. Account Activated

**Subject:** Your Account Has Been Activated

**Body:**
```
Hello {userName},

Your account has been activated. You can now log in to {platformName}.

Login here:
{loginUrl}

If you have any questions, please contact support at {supportEmail}.

Best regards,
The {platformName} Team
```

## 9. Account Deactivated

**Subject:** Account Deactivation Notice

**Body:**
```
Hello {userName},

Your account has been deactivated. If you believe this is an error, please contact support at {supportEmail}.

Best regards,
The {platformName} Team
```

## 10. Bulk Upload Summary

**Subject:** Bulk User Upload Complete

**Body:**
```
Hello {userName},

Your bulk user upload has been completed.

Results:
- ✅ Successfully created: {successCount}
- ❌ Failed: {failedCount}

{failedCount > 0 ? 'Please review the error report attached.' : ''}

View user management:
{loginUrl}

Best regards,
The {platformName} Team
```

## 🔧 Implementation with Supabase Edge Functions

### Setup

1. Create Edge Function:
```bash
supabase functions new send-email
```

2. Install dependencies:
```bash
cd supabase/functions/send-email
npm install nodemailer
```

3. Example function:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { to, subject, template, variables } = await req.json()
  
  // Replace template variables
  let body = template
  Object.entries(variables).forEach(([key, value]) => {
    body = body.replace(new RegExp(`{${key}}`, 'g'), value)
  })
  
  // Send email using your email service
  // (Nodemailer, SendGrid, etc.)
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## 🔧 Implementation with External Service

### Using SendGrid

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const msg = {
  to: userEmail,
  from: 'noreply@trainingassessment.com',
  subject: 'Welcome to Training Assessment Platform',
  html: welcomeEmailTemplate.replace(/{userName}/g, userName),
}

await sgMail.send(msg)
```

### Using AWS SES

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({ region: 'us-east-1' })

const command = new SendEmailCommand({
  Source: 'noreply@trainingassessment.com',
  Destination: { ToAddresses: [userEmail] },
  Message: {
    Subject: { Data: 'Welcome to Training Assessment Platform' },
    Body: { Html: { Data: welcomeEmailTemplate } },
  },
})

await sesClient.send(command)
```

## 📝 Template Customization

1. **Branding:**
   - Add your logo
   - Customize colors
   - Add company name

2. **Tone:**
   - Professional
   - Friendly
   - Encouraging

3. **Content:**
   - Add more details
   - Include links
   - Add call-to-action buttons

## ✅ Testing

- [ ] Test all templates
- [ ] Verify variable replacement
- [ ] Check email formatting
- [ ] Test on multiple email clients
- [ ] Verify links work
- [ ] Check spam score

---

**Email templates are ready for implementation!** 📧
