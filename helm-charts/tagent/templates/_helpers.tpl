{{/*
Common labels
*/}}
{{- define "tagent.labels" -}}
app.kubernetes.io/name: tagent
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end }}

{{/*
Selector labels for a given component
Usage: include "tagent.selectorLabels" (dict "Release" .Release "component" "web")
*/}}
{{- define "tagent.selectorLabels" -}}
app.kubernetes.io/name: tagent
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Full name for a component
*/}}
{{- define "tagent.componentName" -}}
{{- printf "%s-%s" .Release.Name .component | trunc 63 | trimSuffix "-" }}
{{- end }}
