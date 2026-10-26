using Microsoft.AspNetCore.Mvc;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Route("dishes")]
public class DishController : ControllerBase
{
    [HttpGet("test")]
    public async Task<ActionResult<string>> TestEndpoint()
    {
        return Ok("Hello from SmartMenu API!");
    }
}
