"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { useAnthropicKey } from "@/lib/use-anthropic-key"
import { KeyRound } from "lucide-react"

export function ApiKeyDialog() {
  const { apiKey, setApiKey, clearApiKey } = useAnthropicKey()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setValue(apiKey ?? "")
  }

  const handleSave = () => {
    setApiKey(value.trim())
    setOpen(false)
  }

  const handleClear = () => {
    clearApiKey()
    setValue("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <KeyRound data-icon="inline-start" />
        {apiKey ? "API key connected" : "Add API key"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anthropic API key</DialogTitle>
          <DialogDescription>
            Your key is stored only in this browser and sent directly to Anthropic when you run an analysis. It
            never touches our servers.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="api-key">API key</FieldLabel>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-ant-..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
            />
            <FieldDescription>
              Find your key at{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                console.anthropic.com
              </a>
              .
            </FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          {apiKey && (
            <Button variant="ghost" onClick={handleClear}>
              Remove key
            </Button>
          )}
          <Button onClick={handleSave} disabled={!value.trim()}>
            Save key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
