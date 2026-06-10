package cloud

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
)

// EC2InstanceDetail holds everything about an AWS EC2 instance backing a K8s node.
type EC2InstanceDetail struct {
	InstanceID       string            `json:"instance_id"`
	InstanceType     string            `json:"instance_type"`
	AMIID            string            `json:"ami_id"`
	AMIName          string            `json:"ami_name"`
	AMILocation      string            `json:"ami_location"`
	Platform         string            `json:"platform"`
	LaunchTime       string            `json:"launch_time"`
	State            string            `json:"state"`
	Lifecycle        string            `json:"lifecycle"`
	VPCID            string            `json:"vpc_id"`
	VPCName          string            `json:"vpc_name"`
	SubnetID         string            `json:"subnet_id"`
	AvailabilityZone string            `json:"availability_zone"`
	AZId             string            `json:"az_id"`
	PublicIP         string            `json:"public_ip"`
	PrivateIP        string            `json:"private_ip"`
	PublicDNS        string            `json:"public_dns"`
	PrivateDNS       string            `json:"private_dns"`
	SecurityGroups   []SecurityGroup   `json:"security_groups"`
	KeyPair          string            `json:"key_pair"`
	IAMRole          string            `json:"iam_role"`
	Monitoring       string            `json:"monitoring"`
	EBSOptimized     bool              `json:"ebs_optimized"`
	RootDeviceName   string            `json:"root_device_name"`
	RootDeviceType   string            `json:"root_device_type"`
	RootVolumeSize   int32             `json:"root_volume_size"`
	Volumes          []VolumeInfo      `json:"volumes"`
	NetworkInterfaces []NetworkInterface `json:"network_interfaces"`
	Tags             map[string]string `json:"tags"`
	StatusChecks     StatusChecks      `json:"status_checks"`
	VCPUs            int32             `json:"vcpus"`
	Architecture     string            `json:"architecture"`
	Hypervisor       string            `json:"hypervisor"`
	VirtualizationType string          `json:"virtualization_type"`
	Tenancy          string            `json:"tenancy"`
	Reservation      string            `json:"reservation"`
	Owner            string            `json:"owner"`
	Region           string            `json:"region"`
	BootMode         string            `json:"boot_mode"`
	TerminationProtection bool         `json:"termination_protection"`
	StopProtection   bool              `json:"stop_protection"`
	CreditSpec       string            `json:"credit_specification"`
	UsageOperation   string            `json:"usage_operation"`
}

type SecurityGroup struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type VolumeInfo struct {
	ID        string `json:"id"`
	Device    string `json:"device"`
	SizeGB    int32  `json:"size_gb"`
	Type      string `json:"type"`
	Encrypted bool   `json:"encrypted"`
	State     string `json:"state"`
	IOPS      int32  `json:"iops"`
}

type NetworkInterface struct {
	ID         string `json:"id"`
	PrivateIP  string `json:"private_ip"`
	PublicIP   string `json:"public_ip"`
	SubnetID   string `json:"subnet_id"`
	VPCID      string `json:"vpc_id"`
	MacAddress string `json:"mac_address"`
	Status     string `json:"status"`
}

type StatusChecks struct {
	System   string `json:"system"`
	Instance string `json:"instance"`
}

// AWSClient wraps the AWS EC2 client.
type AWSClient struct {
	ec2Client *ec2.Client
	region    string
}

// NewAWSClient creates an AWS client from environment credentials or instance role.
func NewAWSClient() (*AWSClient, error) {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-south-1"
	}

	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(region),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	return &AWSClient{
		ec2Client: ec2.NewFromConfig(cfg),
		region:    region,
	}, nil
}

// IsConfigured returns true if AWS credentials are available.
func (c *AWSClient) IsConfigured() bool {
	return c.ec2Client != nil
}

// GetInstanceDetail fetches full EC2 instance details by instance ID.
func (c *AWSClient) GetInstanceDetail(ctx context.Context, instanceID string) (*EC2InstanceDetail, error) {
	if c.ec2Client == nil {
		return nil, fmt.Errorf("AWS client not configured")
	}

	input := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}

	result, err := c.ec2Client.DescribeInstances(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("DescribeInstances failed: %w", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		return nil, fmt.Errorf("instance %s not found", instanceID)
	}

	inst := result.Reservations[0].Instances[0]
	reservation := ""
	if len(result.Reservations) > 0 {
		reservation = *result.Reservations[0].ReservationId
	}
	owner := ""
	if result.Reservations[0].OwnerId != nil {
		owner = *result.Reservations[0].OwnerId
	}

	detail := &EC2InstanceDetail{
		InstanceID:   safeStr(inst.InstanceId),
		InstanceType: string(inst.InstanceType),
		AMIID:        safeStr(inst.ImageId),
		Platform:     "Linux/UNIX",
		State:        string(inst.State.Name),
		Lifecycle:    "normal",
		VPCID:        safeStr(inst.VpcId),
		SubnetID:     safeStr(inst.SubnetId),
		PublicIP:     safeStr(inst.PublicIpAddress),
		PrivateIP:    safeStr(inst.PrivateIpAddress),
		PublicDNS:    safeStr(inst.PublicDnsName),
		PrivateDNS:   safeStr(inst.PrivateDnsName),
		KeyPair:      safeStr(inst.KeyName),
		EBSOptimized: boolVal(inst.EbsOptimized),
		RootDeviceName: safeStr(inst.RootDeviceName),
		RootDeviceType: string(inst.RootDeviceType),
		Architecture:   string(inst.Architecture),
		Hypervisor:     string(inst.Hypervisor),
		VirtualizationType: string(inst.VirtualizationType),
		Reservation:  reservation,
		Owner:        owner,
		Region:       c.region,
		Tags:         make(map[string]string),
		StatusChecks: StatusChecks{System: "passed", Instance: "passed"},
		VCPUs:        0, // Will fill from instance type if needed
	}

	if inst.LaunchTime != nil {
		detail.LaunchTime = inst.LaunchTime.String()
	}

	if inst.Placement != nil {
		detail.AvailabilityZone = safeStr(inst.Placement.AvailabilityZone)
		detail.Tenancy = string(inst.Placement.Tenancy)
	}

	if inst.Monitoring != nil {
		detail.Monitoring = string(inst.Monitoring.State)
	}

	if inst.IamInstanceProfile != nil {
		arn := safeStr(inst.IamInstanceProfile.Arn)
		// Extract role name from ARN
		parts := strings.Split(arn, "/")
		if len(parts) > 1 {
			detail.IAMRole = parts[len(parts)-1]
		} else {
			detail.IAMRole = arn
		}
	}

	if inst.BootMode != "" {
		detail.BootMode = string(inst.BootMode)
	}

	if inst.UsageOperation != nil {
		detail.UsageOperation = *inst.UsageOperation
	}

	if inst.CpuOptions != nil && inst.CpuOptions.CoreCount != nil && inst.CpuOptions.ThreadsPerCore != nil {
		detail.VCPUs = *inst.CpuOptions.CoreCount * *inst.CpuOptions.ThreadsPerCore
	}

	// Security Groups
	for _, sg := range inst.SecurityGroups {
		detail.SecurityGroups = append(detail.SecurityGroups, SecurityGroup{
			ID:   safeStr(sg.GroupId),
			Name: safeStr(sg.GroupName),
		})
	}

	// Tags
	for _, tag := range inst.Tags {
		if tag.Key != nil && tag.Value != nil {
			detail.Tags[*tag.Key] = *tag.Value
		}
	}

	// Network Interfaces
	for _, ni := range inst.NetworkInterfaces {
		nic := NetworkInterface{
			ID:        safeStr(ni.NetworkInterfaceId),
			PrivateIP: safeStr(ni.PrivateIpAddress),
			SubnetID:  safeStr(ni.SubnetId),
			VPCID:     safeStr(ni.VpcId),
			MacAddress: safeStr(ni.MacAddress),
			Status:    string(ni.Status),
		}
		if ni.Association != nil {
			nic.PublicIP = safeStr(ni.Association.PublicIp)
		}
		detail.NetworkInterfaces = append(detail.NetworkInterfaces, nic)
	}

	// Block Device Mappings (Volumes)
	for _, bdm := range inst.BlockDeviceMappings {
		if bdm.Ebs != nil {
			vol := VolumeInfo{
				ID:     safeStr(bdm.Ebs.VolumeId),
				Device: safeStr(bdm.DeviceName),
				State:  string(bdm.Ebs.Status),
			}
			detail.Volumes = append(detail.Volumes, vol)
		}
	}

	// Fetch volume details for size/type info
	if len(detail.Volumes) > 0 {
		volIDs := make([]string, 0, len(detail.Volumes))
		for _, v := range detail.Volumes {
			if v.ID != "" {
				volIDs = append(volIDs, v.ID)
			}
		}
		if len(volIDs) > 0 {
			c.enrichVolumeDetails(ctx, detail, volIDs)
		}
	}

	// Get AMI name
	if detail.AMIID != "" {
		c.enrichAMIDetails(ctx, detail)
	}

	// Get VPC name from tags
	if detail.VPCID != "" {
		c.enrichVPCName(ctx, detail)
	}

	// Check termination/stop protection
	c.enrichProtection(ctx, detail)

	return detail, nil
}

func (c *AWSClient) enrichVolumeDetails(ctx context.Context, detail *EC2InstanceDetail, volIDs []string) {
	input := &ec2.DescribeVolumesInput{VolumeIds: volIDs}
	result, err := c.ec2Client.DescribeVolumes(ctx, input)
	if err != nil {
		log.Printf("[aws] DescribeVolumes failed: %v", err)
		return
	}
	volMap := map[string]types.Volume{}
	for _, v := range result.Volumes {
		volMap[safeStr(v.VolumeId)] = v
	}
	for i := range detail.Volumes {
		if vol, ok := volMap[detail.Volumes[i].ID]; ok {
			detail.Volumes[i].SizeGB = *vol.Size
			detail.Volumes[i].Type = string(vol.VolumeType)
			detail.Volumes[i].Encrypted = *vol.Encrypted
			if vol.Iops != nil {
				detail.Volumes[i].IOPS = *vol.Iops
			}
			// Set root volume size
			if detail.Volumes[i].Device == detail.RootDeviceName {
				detail.RootVolumeSize = *vol.Size
			}
		}
	}
}

func (c *AWSClient) enrichAMIDetails(ctx context.Context, detail *EC2InstanceDetail) {
	input := &ec2.DescribeImagesInput{ImageIds: []string{detail.AMIID}}
	result, err := c.ec2Client.DescribeImages(ctx, input)
	if err != nil {
		log.Printf("[aws] DescribeImages failed: %v", err)
		return
	}
	if len(result.Images) > 0 {
		img := result.Images[0]
		detail.AMIName = safeStr(img.Name)
		detail.AMILocation = safeStr(img.ImageLocation)
	}
}

func (c *AWSClient) enrichVPCName(ctx context.Context, detail *EC2InstanceDetail) {
	input := &ec2.DescribeVpcsInput{VpcIds: []string{detail.VPCID}}
	result, err := c.ec2Client.DescribeVpcs(ctx, input)
	if err != nil {
		return
	}
	if len(result.Vpcs) > 0 {
		for _, tag := range result.Vpcs[0].Tags {
			if tag.Key != nil && *tag.Key == "Name" && tag.Value != nil {
				detail.VPCName = *tag.Value
				break
			}
		}
	}
}

func (c *AWSClient) enrichProtection(ctx context.Context, detail *EC2InstanceDetail) {
	// Termination protection
	tpInput := &ec2.DescribeInstanceAttributeInput{
		InstanceId: &detail.InstanceID,
		Attribute:  types.InstanceAttributeNameDisableApiTermination,
	}
	tpResult, err := c.ec2Client.DescribeInstanceAttribute(ctx, tpInput)
	if err == nil && tpResult.DisableApiTermination != nil {
		detail.TerminationProtection = *tpResult.DisableApiTermination.Value
	}

	// Stop protection
	spInput := &ec2.DescribeInstanceAttributeInput{
		InstanceId: &detail.InstanceID,
		Attribute:  types.InstanceAttributeNameDisableApiStop,
	}
	spResult, err := c.ec2Client.DescribeInstanceAttribute(ctx, spInput)
	if err == nil && spResult.DisableApiStop != nil {
		detail.StopProtection = *spResult.DisableApiStop.Value
	}

	// Credit specification (for T-type instances)
	if strings.HasPrefix(detail.InstanceType, "t") {
		csInput := &ec2.DescribeInstanceCreditSpecificationsInput{
			InstanceIds: []string{detail.InstanceID},
		}
		csResult, err := c.ec2Client.DescribeInstanceCreditSpecifications(ctx, csInput)
		if err == nil && len(csResult.InstanceCreditSpecifications) > 0 {
			detail.CreditSpec = safeStr(csResult.InstanceCreditSpecifications[0].CpuCredits)
		}
	}
}

// GetInstanceStatus fetches status checks.
func (c *AWSClient) GetInstanceStatus(ctx context.Context, instanceID string) StatusChecks {
	input := &ec2.DescribeInstanceStatusInput{
		InstanceIds: []string{instanceID},
	}
	result, err := c.ec2Client.DescribeInstanceStatus(ctx, input)
	if err != nil || len(result.InstanceStatuses) == 0 {
		return StatusChecks{System: "unknown", Instance: "unknown"}
	}

	status := result.InstanceStatuses[0]
	sc := StatusChecks{System: "unknown", Instance: "unknown"}
	if status.SystemStatus != nil {
		sc.System = string(status.SystemStatus.Status)
	}
	if status.InstanceStatus != nil {
		sc.Instance = string(status.InstanceStatus.Status)
	}
	return sc
}

// ParseInstanceIDFromProviderID extracts the EC2 instance ID from a K8s ProviderID.
// Format: aws:///ZONE/INSTANCE-ID (e.g. aws:///ap-south-1a/i-00c829001996b56c1)
func ParseInstanceIDFromProviderID(providerID string) string {
	if providerID == "" {
		return ""
	}
	// Handle format: aws:///zone/instance-id
	parts := strings.Split(providerID, "/")
	if len(parts) > 0 {
		last := parts[len(parts)-1]
		if strings.HasPrefix(last, "i-") {
			return last
		}
	}
	return ""
}

func safeStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func boolVal(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}
