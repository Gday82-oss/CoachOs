// Edge Function: Email Reminders
// Déclenchée par cron toutes les heures

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in1h = new Date(now.getTime() + 60 * 60 * 1000)

    // Récupérer les séances dans 24h
    const { data: seances24h } = await supabaseClient
      .from('seances')
      .select(`
        id,
        date,
        heure,
        client_id,
        coach_id,
        client:clients(prenom, nom, email),
        coach:coachs(prenom, nom)
      `)
      .eq('fait', false)
      .gte('date', in24h.toISOString().split('T')[0])
      .lt('date', new Date(in24h.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    // Récupérer les configs des coachs
    const { data: configs } = await supabaseClient
      .from('coach_config')
      .select('*')

    const configMap = new Map(configs?.map(c => [c.coach_id, c]) ?? [])

    const emailsToSend = []

    // Traiter rappels 24h
    for (const seance of seances24h ?? []) {
      const config = configMap.get(seance.coach_id)
      
      if (config?.rappel_24h !== false) {
        // Vérifier si email déjà envoyé
        const { data: existing } = await supabaseClient
          .from('email_logs')
          .select('id')
          .eq('seance_id', seance.id)
          .eq('type', 'rappel_24h')
          .single()

        if (!existing) {
          emailsToSend.push({
            coach_id: seance.coach_id,
            client_id: seance.client_id,
            seance_id: seance.id,
            type: 'rappel_24h',
            to: seance.client?.email,
            subject: `Rappel: Votre séance demain à ${seance.heure?.slice(0, 5)}`,
            content: `
Bonjour ${seance.client?.prenom},

Ceci est un rappel pour votre séance de sport-santé demain :

📅 Date: ${new Date(seance.date).toLocaleDateString('fr-FR')}
🕐 Heure: ${seance.heure?.slice(0, 5)}
👤 Coach: ${seance.coach?.prenom} ${seance.coach?.nom}

À demain !

MyCareCoach
Votre santé en mouvement
            `.trim()
          })
        }
      }
    }

    // Envoyer les emails (simulation - remplacer par vrai service email)
    for (const email of emailsToSend) {
      // TODO: Intégrer SendGrid, Resend, ou autre
      console.log('Envoi email:', email.to, email.subject)

      // Log l'envoi
      await supabaseClient.from('email_logs').insert({
        coach_id: email.coach_id,
        client_id: email.client_id,
        seance_id: email.seance_id,
        type: email.type,
        statut: 'envoye'
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails_sent: emailsToSend.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
