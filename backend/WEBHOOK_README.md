# Outgoing Webhook Module

The outgoing webhook module enables the RAG chatbot to send HTTP POST notifications to external services when specific events occur. This allows for powerful integrations with services like Slack, Discord, Microsoft Teams, and custom endpoints.

## Features

- ✅ **Event-based Triggers**: Automatically send webhooks when tasks, reminders, or chat events occur
- ✅ **Multiple Authentication Methods**: Support for Bearer tokens, API keys, Basic auth, and no auth
- ✅ **Retry Logic**: Configurable retry attempts with exponential backoff
- ✅ **Execution Logs**: Track all webhook executions with detailed logs
- ✅ **Statistics**: Monitor success rates, failure counts, and response times
- ✅ **AI Integration**: Manage webhooks through natural language using LangChain tools
- ✅ **Custom Payloads**: Format data appropriately for different event types
- ✅ **Filtering**: Organize webhooks with tags and filter by event types

## Supported Event Types

The webhook module supports the following event types:

- `task_created` - Triggered when a new task is created
- `task_updated` - Triggered when a task is modified
- `task_completed` - Triggered when a task is marked as completed
- `task_deleted` - Triggered when a task is deleted
- `reminder_created` - Triggered when a new reminder is created
- `reminder_due` - Triggered when a reminder becomes due
- `reminder_completed` - Triggered when a reminder is completed
- `chat_message` - Triggered for chat messages (can be enabled per webhook)
- `custom` - Manually triggered webhooks with custom payloads

## Architecture

### Components

1. **Models** (`models/webhook_models.py`)
   - `Webhook`: Main webhook configuration model
   - `WebhookLog`: Execution log model
   - `WebhookEvent`: Enum of supported event types
   - `WebhookStatus`: Active, inactive, or disabled states
   - `WebhookAuthType`: Authentication method types

2. **Repository** (`database/webhook_repository.py`)
   - CRUD operations for webhooks
   - Log management
   - Statistics and analytics
   - Event-based webhook queries

3. **Utilities** (`utils/webhook_utils.py`)
   - HTTP request sending with aiohttp
   - Retry logic with exponential backoff
   - Payload formatting for different event types
   - Header preparation and authentication
   - Error handling and logging

4. **Tools** (`utils/webhook_tools.py`)
   - LangChain tools for AI agent integration
   - Natural language webhook management
   - Manual webhook triggering

5. **API Endpoints** (`api/main.py`)
   - RESTful API for webhook management
   - Testing endpoints
   - Log retrieval
   - Statistics endpoints

## API Endpoints

### Webhook Management

- `POST /api/webhooks/create` - Create a new webhook
- `GET /api/webhooks/list` - List all webhooks with filtering
- `GET /api/webhooks/{id}` - Get webhook details
- `PUT /api/webhooks/{id}` - Update webhook configuration
- `DELETE /api/webhooks/{id}` - Delete a webhook
- `POST /api/webhooks/bulk-delete` - Delete multiple webhooks

### Testing & Monitoring

- `POST /api/webhooks/{id}/test` - Test a webhook with custom payload
- `GET /api/webhooks/{id}/logs` - Get execution logs for a webhook
- `GET /api/webhooks/tags/list` - Get all webhook tags
- `GET /api/webhooks/stats/summary` - Get webhook statistics

## Usage Examples

### Creating a Webhook via API

```bash
curl -X POST "http://localhost:8000/api/webhooks/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Task Notifications",
    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "description": "Send notifications to Slack when tasks are completed",
    "events": ["task_completed", "task_created"],
    "status": "active",
    "auth_type": "none",
    "retry_enabled": true,
    "retry_count": 3,
    "timeout_seconds": 30,
    "tags": ["slack", "tasks"]
  }'
```

### Creating a Webhook with Authentication

```bash
curl -X POST "http://localhost:8000/api/webhooks/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Discord Webhook with Auth",
    "url": "https://discord.com/api/webhooks/YOUR/WEBHOOK",
    "events": ["reminder_due"],
    "auth_type": "bearer",
    "auth_token": "your-secret-token",
    "headers": {
      "X-Custom-Header": "value"
    }
  }'
```

### Using Natural Language (via AI Agent)

Users can manage webhooks through the chatbot using natural language:

```
User: "Create a webhook for Slack at https://hooks.slack.com/... 
       that triggers when tasks are completed"

AI: Creates the webhook using the create_webhook_tool

User: "Show me all my webhooks"

AI: Lists all webhooks using the list_webhooks_tool

User: "Test my Slack webhook"

AI: Triggers a test webhook using the trigger_custom_webhook_tool
```

### Webhook Payload Format

When a webhook is triggered, it receives a JSON payload in this format:

```json
{
  "event": "task_completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "task_abc123",
    "title": "Complete project documentation",
    "description": "Write comprehensive docs",
    "status": "completed",
    "priority": "high",
    "tags": ["documentation", "project"],
    "created_at": "2024-01-10T08:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Integration with Existing Systems

The webhook module is automatically integrated with:

### Tasks
- Creates webhooks trigger on task creation
- Updates webhooks trigger on task modification
- Deletes webhooks trigger on task deletion
- Status changes to "completed" trigger task_completed webhooks

### Reminders
- Creates webhooks trigger on reminder creation
- Complete webhooks trigger when reminders are marked done
- Due webhooks can be triggered by the scheduler (not implemented yet)

### Chat Messages
- Custom integration possible for chat_message events
- Not automatically triggered to avoid spam

## Authentication Methods

### None
No authentication required. Suitable for public webhooks or local testing.

```json
{
  "auth_type": "none"
}
```

### Bearer Token
Authorization header with Bearer token.

```json
{
  "auth_type": "bearer",
  "auth_token": "your-secret-token"
}
```

### API Key
Custom X-API-Key header.

```json
{
  "auth_type": "api_key",
  "auth_token": "your-api-key"
}
```

### Basic Auth
HTTP Basic Authentication with username and password.

```json
{
  "auth_type": "basic",
  "auth_username": "username",
  "auth_password": "password"
}
```

## Configuration

### Retry Settings

Webhooks support automatic retry with exponential backoff:

- `retry_enabled`: Enable/disable retry (default: true)
- `retry_count`: Number of retry attempts (0-10, default: 3)
- `timeout_seconds`: Request timeout (1-300 seconds, default: 30)

### Exponential Backoff

Wait times between retries:
- 1st retry: 1 second
- 2nd retry: 2 seconds
- 3rd retry: 4 seconds
- Maximum wait: 30 seconds

## Monitoring and Debugging

### Execution Logs

Each webhook execution creates a log entry with:
- Request details (URL, payload, headers)
- Response details (status code, body, time)
- Error messages (if failed)
- Retry attempt number

### Statistics

Track webhook performance:
- Total triggers
- Success count
- Failure count
- Success rate percentage
- Last triggered timestamp

### Viewing Logs

```bash
# Get logs for a specific webhook
curl "http://localhost:8000/api/webhooks/{webhook_id}/logs?page=1&page_size=50"

# Get webhook statistics
curl "http://localhost:8000/api/webhooks/stats/summary"
```

## Security Considerations

1. **Sensitive Data**: Authentication tokens and passwords are sanitized in logs
2. **HTTPS**: Use HTTPS webhooks in production
3. **Rate Limiting**: Consider implementing rate limits for production
4. **Validation**: Webhook URLs are validated before saving
5. **Error Handling**: Failed webhooks don't crash the application

## Testing

Run the test suite to verify webhook functionality:

```bash
cd backend
python test_webhooks.py
```

Note: MongoDB must be running for tests to work.

## Common Integration Examples

### Slack

```json
{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
  "events": ["task_completed", "reminder_due"],
  "auth_type": "none"
}
```

### Discord

```json
{
  "name": "Discord Alerts",
  "url": "https://discord.com/api/webhooks/123456789/abcdefghijklmnop",
  "events": ["task_created", "task_completed"],
  "auth_type": "none"
}
```

### Microsoft Teams

```json
{
  "name": "Teams Channel",
  "url": "https://outlook.office.com/webhook/...",
  "events": ["task_completed"],
  "auth_type": "none"
}
```

### Custom Endpoint with Authentication

```json
{
  "name": "Internal API",
  "url": "https://api.example.com/webhooks/tasks",
  "events": ["task_created", "task_updated", "task_completed"],
  "auth_type": "bearer",
  "auth_token": "your-secret-token",
  "headers": {
    "X-App-Id": "rag-chatbot"
  }
}
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Webhook templates for popular services
- [ ] Payload transformations with custom scripts
- [ ] Signature verification for security
- [ ] Rate limiting per webhook
- [ ] Scheduled webhooks (cron-like)
- [ ] Webhook chaining (trigger multiple webhooks)
- [ ] Advanced filtering (conditional triggers)
- [ ] Webhook analytics dashboard
- [ ] Email notifications as an alternative
- [ ] Webhook marketplace/directory

## Troubleshooting

### Webhook Not Triggering

1. Check webhook status is "active"
2. Verify the event type is in the webhook's events list
3. Check logs for errors: `GET /api/webhooks/{id}/logs`
4. Test the webhook: `POST /api/webhooks/{id}/test`

### Authentication Errors

1. Verify auth_type matches the endpoint requirements
2. Check auth_token is correct and not expired
3. Review custom headers if using API key authentication

### Timeout Errors

1. Increase timeout_seconds value
2. Check if the webhook endpoint is responsive
3. Consider enabling retry for better reliability

### Connection Refused

1. Verify the webhook URL is correct and accessible
2. Check firewall rules if using internal endpoints
3. Ensure HTTPS is used for production webhooks

## Support

For issues or questions about the webhook module:
1. Check execution logs for error details
2. Review webhook configuration settings
3. Test with a simple endpoint first
4. Check MongoDB connection if webhooks aren't saving

---

**Built as part of the RAG Chatbot Productivity Suite** 🚀
