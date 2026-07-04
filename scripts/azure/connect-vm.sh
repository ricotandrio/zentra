#!/usr/bin/env bash
set -e

KEY_PATH=".creds/zentra-vm_key.pem"
VM_IP="$1"
USER="${2:-azureuser}"

if [ -z "$VM_IP" ]; then
  echo "Usage: ./scripts/azure/connect-vm.sh <vm-ip> <user>"
  exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
  echo "Key not found: $KEY_PATH"
  exit 1
fi

echo "Setting key permissions..."
chmod 400 "$KEY_PATH"

echo "Connecting to $USER@$VM_IP ..."
ssh -i "$KEY_PATH" "$USER@$VM_IP"
