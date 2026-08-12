using System.Diagnostics;
using System.Reflection;

namespace GentillCompetenciaAPAC;

internal static class Program
{
    private const string Version = "2.4.0";

    [STAThread]
    private static int Main()
    {
        try
        {
            var appDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "GentillMobOps",
                "GentillCompetenciaAPAC",
                Version);

            Directory.CreateDirectory(appDir);

            ExtractResource("GentillCompetenciaAPAC.Embedded.index.html", Path.Combine(appDir, "index.html"));
            ExtractResource("GentillCompetenciaAPAC.Embedded.styles.css", Path.Combine(appDir, "styles.css"));
            ExtractResource("GentillCompetenciaAPAC.Embedded.app.js", Path.Combine(appDir, "app.js"));

            var indexPath = Path.Combine(appDir, "index.html");
            var indexUri = new Uri(indexPath).AbsoluteUri;

            var edge = FindEdge();
            if (!string.IsNullOrWhiteSpace(edge))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = edge,
                    Arguments = $"--app=\"{indexUri}\" --start-maximized",
                    UseShellExecute = true,
                    WorkingDirectory = appDir
                });
            }
            else
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = indexPath,
                    UseShellExecute = true,
                    WorkingDirectory = appDir
                });
            }

            return 0;
        }
        catch (Exception ex)
        {
            try
            {
                var logPath = Path.Combine(Path.GetTempPath(), "GentillCompetenciaAPAC_v2.4.0_error.txt");
                File.WriteAllText(logPath, ex.ToString());
                System.Windows.Forms.MessageBox.Show(
                    $"Não foi possível iniciar o Gentill Competência APAC.\n\nDetalhes registrados em:\n{logPath}\n\n{ex.Message}",
                    "Gentill Competência APAC",
                    System.Windows.Forms.MessageBoxButtons.OK,
                    System.Windows.Forms.MessageBoxIcon.Error);
            }
            catch
            {
                Console.Error.WriteLine(ex);
            }

            return 1;
        }
    }

    private static void ExtractResource(string resourceName, string destination)
    {
        var assembly = Assembly.GetExecutingAssembly();
        using var input = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Recurso incorporado não encontrado: {resourceName}");

        using var output = new FileStream(destination, FileMode.Create, FileAccess.Write, FileShare.Read);
        input.CopyTo(output);
    }

    private static string? FindEdge()
    {
        var candidates = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft", "Edge", "Application", "msedge.exe")
        };

        return candidates.FirstOrDefault(File.Exists);
    }
}
