// Package events provides a shared Kafka event bus for Tagent services.
//
// Topics:
//   - tagent.incidents.detected    → new incident detected (from Monitoring)
//   - tagent.incidents.resolved    → incident resolved (from Remediation)
//   - tagent.remediation.requested → remediation action requested (from AI/Guardian)
//   - tagent.remediation.completed → remediation action completed (from Remediation)
//   - tagent.discovery.changed     → cluster state changed (from Discovery)
//   - tagent.escalation.triggered  → escalation chain started (from Notification)
//
// All events use JSON serialization with the Event struct as envelope.
package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/segmentio/kafka-go"
)

// Topic constants
const (
	TopicIncidentDetected    = "tagent.incidents.detected"
	TopicIncidentResolved    = "tagent.incidents.resolved"
	TopicRemediationRequested = "tagent.remediation.requested"
	TopicRemediationCompleted = "tagent.remediation.completed"
	TopicDiscoveryChanged    = "tagent.discovery.changed"
	TopicEscalationTriggered = "tagent.escalation.triggered"
)

// AllTopics lists all Tagent topics for auto-creation
var AllTopics = []string{
	TopicIncidentDetected,
	TopicIncidentResolved,
	TopicRemediationRequested,
	TopicRemediationCompleted,
	TopicDiscoveryChanged,
	TopicEscalationTriggered,
}

// Event is the envelope for all Kafka messages
type Event struct {
	ID        string      `json:"id"`
	Type      string      `json:"type"`       // topic name
	Source    string      `json:"source"`     // service that produced it
	Timestamp string      `json:"timestamp"`  // RFC3339
	Payload   interface{} `json:"payload"`    // event-specific data
}

// IncidentEvent payload for incident events
type IncidentEvent struct {
	IncidentID string `json:"incident_id"`
	Title      string `json:"title"`
	Severity   string `json:"severity"`
	Status     string `json:"status"`
	Service    string `json:"service"`
	Namespace  string `json:"namespace"`
	RootCause  string `json:"root_cause,omitempty"`
}

// RemediationEvent payload for remediation events
type RemediationEvent struct {
	Action    string `json:"action"`
	Target    string `json:"target"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	DryRun    bool   `json:"dry_run"`
	Reason    string `json:"reason,omitempty"`
}

// DiscoveryEvent payload for cluster state changes
type DiscoveryEvent struct {
	ChangeType string `json:"change_type"` // "pod_added", "pod_removed", "node_notready", etc.
	Resource   string `json:"resource"`    // resource kind
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Detail     string `json:"detail"`
}

// EscalationEvent payload for escalation events
type EscalationEvent struct {
	EscalationID string `json:"escalation_id"`
	IncidentID   string `json:"incident_id"`
	Title        string `json:"title"`
	Severity     string `json:"severity"`
	Level        int    `json:"level"`
	Channel      string `json:"channel"`
	Status       string `json:"status"`
}

// Publisher publishes events to Kafka
type Publisher struct {
	writer  *kafka.Writer
	source  string
	counter int
}

// Consumer consumes events from Kafka
type Consumer struct {
	reader *kafka.Reader
}

// Handler is a function that handles an event
type Handler func(ctx context.Context, event Event) error

// NewPublisher creates a new Kafka event publisher
func NewPublisher(source string) *Publisher {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		brokers = "localhost:9092"
	}

	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers),
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: kafka.RequireOne,
	}

	p := &Publisher{writer: writer, source: source}
	log.Printf("[events] Publisher created for service: %s (brokers: %s)", source, brokers)
	return p
}

// Publish sends an event to the specified topic
func (p *Publisher) Publish(ctx context.Context, topic string, payload interface{}) error {
	p.counter++
	event := Event{
		ID:        fmt.Sprintf("%s-%d-%d", p.source, time.Now().UnixNano(), p.counter),
		Type:      topic,
		Source:    p.source,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Payload:   payload,
	}

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(event.ID),
		Value: data,
	}

	err = p.writer.WriteMessages(ctx, msg)
	if err != nil {
		log.Printf("[events] Publish to %s failed: %v", topic, err)
		return err
	}

	log.Printf("[events] Published to %s: %s", topic, event.ID)
	return nil
}

// PublishIncident publishes an incident event
func (p *Publisher) PublishIncident(ctx context.Context, topic string, inc IncidentEvent) error {
	return p.Publish(ctx, topic, inc)
}

// PublishRemediation publishes a remediation event
func (p *Publisher) PublishRemediation(ctx context.Context, topic string, rem RemediationEvent) error {
	return p.Publish(ctx, topic, rem)
}

// PublishDiscovery publishes a discovery change event
func (p *Publisher) PublishDiscovery(ctx context.Context, change DiscoveryEvent) error {
	return p.Publish(ctx, TopicDiscoveryChanged, change)
}

// PublishEscalation publishes an escalation event
func (p *Publisher) PublishEscalation(ctx context.Context, esc EscalationEvent) error {
	return p.Publish(ctx, TopicEscalationTriggered, esc)
}

// Close closes the publisher
func (p *Publisher) Close() error {
	return p.writer.Close()
}

// NewConsumer creates a new Kafka event consumer for a specific topic
func NewConsumer(topic, groupID string) *Consumer {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		brokers = "localhost:9092"
	}

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{brokers},
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       1,
		MaxBytes:       10e6, // 10MB
		CommitInterval: time.Second,
		StartOffset:    kafka.LastOffset,
	})

	log.Printf("[events] Consumer created: topic=%s group=%s", topic, groupID)
	return &Consumer{reader: reader}
}

// Consume starts consuming events and calling the handler for each
func (c *Consumer) Consume(ctx context.Context, handler Handler) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return // context cancelled
			}
			log.Printf("[events] Read error: %v", err)
			time.Sleep(time.Second)
			continue
		}

		var event Event
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("[events] Unmarshal error: %v", err)
			continue
		}

		if err := handler(ctx, event); err != nil {
			log.Printf("[events] Handler error for %s: %v", event.ID, err)
		}
	}
}

// Close closes the consumer
func (c *Consumer) Close() error {
	return c.reader.Close()
}

// EnsureTopics creates all Tagent topics if they don't exist
func EnsureTopics() error {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		brokers = "localhost:9092"
	}

	conn, err := kafka.DialContext(context.Background(), "tcp", brokers)
	if err != nil {
		return fmt.Errorf("dial kafka: %w", err)
	}
	defer conn.Close()

	var topicConfigs []kafka.TopicConfig
	for _, topic := range AllTopics {
		topicConfigs = append(topicConfigs, kafka.TopicConfig{
			Topic:             topic,
			NumPartitions:     3,
			ReplicationFactor: 1,
		})
	}

	err = conn.CreateTopics(topicConfigs...)
	if err != nil {
		// Ignore "topic already exists" errors
		log.Printf("[events] Topic creation result: %v", err)
	} else {
		log.Printf("[events] All topics created successfully")
	}
	return nil
}
