# Gmail Push Notifications Setup

This guide explains how to set up Gmail Push Notifications using Google Cloud Pub/Sub.

## Prerequisites

1. Google Cloud Project with billing enabled
2. Gmail API enabled
3. Cloud Pub/Sub API enabled

## Setup Steps

### 1. Create a Pub/Sub Topic

```bash
# Create the topic
gcloud pubsub topics create gmail-notifications

# Grant Gmail permission to publish to the topic
gcloud pubsub topics add-iam-policy-binding gmail-notifications \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

### 2. Create a Subscription

```bash
# Create a push subscription pointing to your webhook
gcloud pubsub subscriptions create -sub \
  --topic= \
  --push-endpoint=https://your-domain.com/api/gmail-push/webhook
```

### 3. Environment Variables

Add to your `.env.local`:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

### 4. Setup Push Notifications

Call the setup endpoint after user authentication:

```javascript
POST /api/gmail-push/setup
```

This will:
- Set up Gmail watch for the user's inbox
- Return the history ID and expiration time
- Start receiving push notifications

### 5. Webhook Processing

The webhook at `/api/gmail-push/webhook` will:
- Receive Pub/Sub messages
- Decode the Gmail notification
- Fetch new emails from Gmail
- Process them into the queue

## Security Considerations

1. Verify webhook authenticity (add token verification if needed)
2. Rate limit the webhook endpoint
3. Validate Pub/Sub message format
4. Handle retries gracefully

## Monitoring

Monitor the following:
- Push notification delivery success rate
- Webhook processing times
- Queue processing delays
- API quota usage

## Troubleshooting

Common issues:
- **403 errors**: Check IAM permissions for the service account
- **Push not working**: Verify the endpoint URL is publicly accessible
- **Missing emails**: Check history ID tracking and Gmail API quotas